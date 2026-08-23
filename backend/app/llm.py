"""Fallback solver for questions not matched by any template.

Routes to the configured provider (Dify chatflow, or a direct OpenAI/Anthropic
call) and returns a worked explanation plus similar practice problems. All
providers share the same JSON schema (see ``prompts.py``) and are gracefully
disabled when not configured.
"""
from __future__ import annotations

import json
from typing import Optional

import httpx
from pydantic import ValidationError

from .config import get_settings
from .dify import solve_with_dify
from .models import Problem
from .prompts import (
    SYSTEM_PROMPT,
    LLMPayload,
    build_image_prompt,
    build_user_prompt,
    loads_lenient,
    strip_fences,
    to_result,
)


def llm_available() -> bool:
    """True when the active fallback provider is configured."""
    return get_settings().llm_enabled


def active_provider() -> str:
    return get_settings().fallback_provider.lower()


def ai_reachable(timeout: float = 4.0) -> bool:
    """Quick liveness check for the active AI provider.

    Distinguishes "configured but offline" (e.g. the local Ollama tunnel is
    down) from "not configured". Returns False fast instead of hanging on the
    long inference timeout. Dify is assumed reachable when configured.
    """
    settings = get_settings()
    if not settings.llm_enabled:
        return False
    if active_provider() == "dify":
        return True
    base = settings.llm_api_base
    if not base:
        # Real OpenAI/Anthropic with a key: assume reachable (network is fine).
        return bool(settings.llm_api_key)
    try:
        url = base.rstrip("/") + "/models"
        headers = {}
        if settings.llm_api_key:
            headers["Authorization"] = f"Bearer {settings.llm_api_key}"
        resp = httpx.get(url, headers=headers, timeout=timeout)
        return resp.status_code == 200
    except httpx.HTTPError:
        return False


def _system_prompt() -> str:
    """System prompt, disabling Qwen3's <think> block for faster local runs."""
    model = get_settings().llm_model.lower()
    if "qwen3" in model:
        return SYSTEM_PROMPT + " /no_think"
    return SYSTEM_PROMPT


def _call_openai(question: str, count: int) -> str:
    settings = get_settings()
    base = (settings.llm_api_base or "https://api.openai.com/v1").rstrip("/")
    headers = {"Content-Type": "application/json"}
    # Local servers like Ollama need no key; only send auth when we have one.
    if settings.llm_api_key:
        headers["Authorization"] = f"Bearer {settings.llm_api_key}"
    resp = httpx.post(
        f"{base}/chat/completions",
        headers=headers,
        json={
            "model": settings.llm_model,
            "messages": [
                {"role": "system", "content": _system_prompt()},
                {"role": "user", "content": build_user_prompt(question, count)},
            ],
            "temperature": 0.7,
            "response_format": {"type": "json_object"},
            "stream": False,
        },
        timeout=300.0,
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


def _call_anthropic(question: str, count: int) -> str:
    settings = get_settings()
    resp = httpx.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": settings.llm_api_key or "",
            "anthropic-version": "2023-06-01",
        },
        json={
            "model": settings.llm_model,
            "max_tokens": 2000,
            "system": SYSTEM_PROMPT,
            "messages": [
                {"role": "user", "content": build_user_prompt(question, count)},
            ],
        },
        timeout=60.0,
    )
    resp.raise_for_status()
    return resp.json()["content"][0]["text"]


def _raw_call(question: str, count: int) -> str:
    if get_settings().llm_provider.lower() == "anthropic":
        return _call_anthropic(question, count)
    return _call_openai(question, count)


def _call_openai_raw(query: str, count: int) -> str:
    """Send an arbitrary pre-built query to the OpenAI-compatible endpoint."""
    settings = get_settings()
    base = (settings.llm_api_base or "https://api.openai.com/v1").rstrip("/")
    headers = {"Content-Type": "application/json"}
    if settings.llm_api_key:
        headers["Authorization"] = f"Bearer {settings.llm_api_key}"
    resp = httpx.post(
        f"{base}/chat/completions",
        headers=headers,
        json={
            "model": settings.llm_model,
            "messages": [
                {"role": "system", "content": _system_prompt()},
                {"role": "user", "content": query},
            ],
            "temperature": 0.7,
            "response_format": {"type": "json_object"},
            "stream": False,
        },
        timeout=300.0,
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


def _call_anthropic_raw(query: str) -> str:
    settings = get_settings()
    resp = httpx.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": settings.llm_api_key or "",
            "anthropic-version": "2023-06-01",
        },
        json={
            "model": settings.llm_model,
            "max_tokens": 2000,
            "system": SYSTEM_PROMPT,
            "messages": [{"role": "user", "content": query}],
        },
        timeout=120.0,
    )
    resp.raise_for_status()
    return resp.json()["content"][0]["text"]


def raw_chat_query(query: str, count: int) -> str:
    """Provider-agnostic raw chat for a pre-built query string.

    Routes to the active fallback provider (Dify or a direct/local LLM) and
    returns the raw answer text. Used by the Analysis helper and the exact
    "Solutions" solve so they respect whatever provider is configured.
    """
    provider = active_provider()
    if provider == "dify":
        from .dify import call_chatflow_query

        return call_chatflow_query(query, count)
    if get_settings().llm_provider.lower() == "anthropic":
        return _call_anthropic_raw(query)
    return _call_openai_raw(query, count)


def _solve_direct(
    question: str, count: int
) -> Optional[tuple[Problem, list[Problem], list[str]]]:
    """Direct OpenAI/Anthropic path."""
    if not get_settings().direct_llm_enabled:
        return None

    last_err: Optional[Exception] = None
    for _ in range(2):  # one retry on parse failure
        try:
            raw = _raw_call(question, count)
            payload = LLMPayload.model_validate(loads_lenient(strip_fences(raw)))
            return to_result(payload, count)
        except (json.JSONDecodeError, ValidationError, KeyError, httpx.HTTPError) as exc:
            last_err = exc
            continue
    print(f"[llm] fallback failed: {last_err}")
    return None


def solve_fallback(
    question: str, count: int
) -> Optional[tuple[str, Problem, list[Problem], list[str]]]:
    """Route to the configured fallback provider.

    Returns ``(source, original, practice, concept_review)`` where ``source`` is
    the provider name used ("dify" or "llm"), or ``None`` if unavailable/failed.
    """
    if active_provider() == "dify":
        result = solve_with_dify(question, count)
        if result is not None:
            original, practice, review = result
            return "dify", original, practice, review
        return None

    result = _solve_direct(question, count)
    if result is not None:
        original, practice, review = result
        return "llm", original, practice, review
    return None


# ---------------------------------------------------------------------------
# Vision (photo of a problem) via an OpenAI-compatible endpoint (e.g. Ollama).
# ---------------------------------------------------------------------------
def _call_openai_vision(
    prompt: str, content: bytes, content_type: str, count: int
) -> str:
    """Send an image + prompt to the OpenAI-compatible vision model."""
    import base64

    settings = get_settings()
    base = (settings.llm_api_base or "https://api.openai.com/v1").rstrip("/")
    headers = {"Content-Type": "application/json"}
    if settings.llm_api_key:
        headers["Authorization"] = f"Bearer {settings.llm_api_key}"
    b64 = base64.b64encode(content).decode("ascii")
    data_uri = f"data:{content_type};base64,{b64}"
    resp = httpx.post(
        f"{base}/chat/completions",
        headers=headers,
        json={
            "model": settings.llm_vision_model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": data_uri}},
                    ],
                },
            ],
            "temperature": 0.5,
            "stream": False,
        },
        timeout=300.0,
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


def local_vision_available() -> bool:
    s = get_settings()
    return (
        active_provider() != "dify"
        and bool(s.llm_api_base)
        and bool(s.llm_vision_model)
    )


def solve_image_local(
    content: bytes, content_type: str, count: int, prompt: Optional[str] = None
) -> Optional[tuple[Problem, list[Problem], list[str]]]:
    """Read + solve a photographed problem with a local vision model."""
    if not local_vision_available():
        return None
    query = prompt or build_image_prompt(count)
    last_err: Optional[Exception] = None
    for _ in range(2):
        try:
            raw = _call_openai_vision(query, content, content_type, count)
            payload = LLMPayload.model_validate(loads_lenient(strip_fences(raw)))
            return to_result(payload, count)
        except (json.JSONDecodeError, ValidationError, KeyError, httpx.HTTPError) as exc:
            last_err = exc
            continue
    print(f"[llm] local vision solve failed: {last_err}")
    return None


# ---------------------------------------------------------------------------
# Free-form tutoring chat (plain-text answer, LaTeX allowed).
# ---------------------------------------------------------------------------
_CHAT_SYSTEM = (
    "You are a friendly, patient math tutor for high-school Geometry and "
    "Analysis Honors. Answer the student's question clearly and concisely. "
    "Wrap any math in LaTeX using \\( ... \\) for inline and \\[ ... \\] for "
    "display. Do not output JSON. Do not use Markdown headings (#), bold (**), "
    "or bullet stars; write in plain sentences and short paragraphs. Keep "
    "answers focused and encouraging."
)


def _strip_think(text: str) -> str:
    text = (text or "").strip()
    if "</think>" in text:
        text = text.rsplit("</think>", 1)[1].strip()
    return text


def _chat_openai(messages: list[dict], system: str) -> str:
    settings = get_settings()
    base = (settings.llm_api_base or "https://api.openai.com/v1").rstrip("/")
    headers = {"Content-Type": "application/json"}
    if settings.llm_api_key:
        headers["Authorization"] = f"Bearer {settings.llm_api_key}"
    if "qwen3" in settings.llm_model.lower():
        system = system + " /no_think"
    resp = httpx.post(
        f"{base}/chat/completions",
        headers=headers,
        json={
            "model": settings.llm_model,
            "messages": [{"role": "system", "content": system}, *messages],
            "temperature": 0.5,
            "stream": False,
        },
        timeout=300.0,
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


def _chat_anthropic(messages: list[dict], system: str) -> str:
    settings = get_settings()
    resp = httpx.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": settings.llm_api_key or "",
            "anthropic-version": "2023-06-01",
        },
        json={
            "model": settings.llm_model,
            "max_tokens": 1500,
            "system": system,
            "messages": messages,
        },
        timeout=120.0,
    )
    resp.raise_for_status()
    return resp.json()["content"][0]["text"]


def chat_reply(
    question: str,
    context: Optional[str] = None,
    history: Optional[list[dict]] = None,
) -> Optional[str]:
    """Answer a free-form tutoring question in plain text (LaTeX allowed).

    ``context`` is optional background (the problem/tab the student is looking
    at). ``history`` is a list of prior {role, content} turns. Returns the
    answer text, or ``None`` when no provider is available / on failure.
    """
    if not llm_available():
        return None

    system = _CHAT_SYSTEM
    if context:
        system = f"{system}\n\nThe student is currently looking at:\n{context}"

    messages: list[dict] = []
    if history:
        for turn in history:
            role = turn.get("role")
            content = turn.get("content")
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": question})

    try:
        if active_provider() == "dify":
            # Fold context + question into a single query for the Dify chatflow.
            parts = [p for p in (context, question) if p]
            from .dify import call_chatflow_query

            raw = call_chatflow_query("\n\n".join(parts), 0)
        elif get_settings().llm_provider.lower() == "anthropic":
            raw = _chat_anthropic(messages, system)
        else:
            raw = _chat_openai(messages, system)
    except httpx.HTTPError as exc:
        print(f"[llm] chat failed: {exc}")
        return None
    return _strip_think(raw)
