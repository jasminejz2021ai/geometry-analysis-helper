"""Dify chatflow client used as the fallback solver.

Calls a Dify "chatflow"/chat app via POST {base}/v1/chat-messages in blocking
mode, then parses the returned answer into the shared original/practice schema.
Also supports solving a photographed problem by uploading the image to Dify's
file API and passing it to the chat message. Gracefully disabled when no Dify
API key is configured.
"""
from __future__ import annotations

import json
from typing import Optional

import httpx
from pydantic import ValidationError

from .config import get_settings
from .models import Problem
from .prompts import build_user_prompt, build_image_prompt, loads_lenient, strip_fences, to_result, LLMPayload


def dify_available() -> bool:
    return get_settings().dify_enabled


def _call_chatflow(question: str, count: int) -> str:
    """Return the raw answer string from the Dify chat app."""
    return call_chatflow_query(build_user_prompt(question, count), count)


def call_chatflow_query(query: str, count: int) -> str:
    """Send a pre-built query to the Dify chat app; return the answer text."""
    settings = get_settings()
    base = settings.dify_api_base.rstrip("/")
    resp = httpx.post(
        f"{base}/v1/chat-messages",
        headers={
            "Authorization": f"Bearer {settings.dify_api_key}",
            "Content-Type": "application/json",
        },
        json={
            "inputs": {"count": count},
            "query": query,
            "response_mode": "blocking",
            "user": "geometry-tutor",
            "conversation_id": "",
        },
        timeout=90.0,
    )
    resp.raise_for_status()
    return resp.json().get("answer", "")


def _upload_file(content: bytes, filename: str, content_type: str) -> str:
    """Upload an image to Dify and return its file id."""
    settings = get_settings()
    base = settings.dify_api_base.rstrip("/")
    resp = httpx.post(
        f"{base}/v1/files/upload",
        headers={"Authorization": f"Bearer {settings.dify_api_key}"},
        files={"file": (filename, content, content_type)},
        data={"user": "geometry-tutor"},
        timeout=90.0,
    )
    resp.raise_for_status()
    return resp.json()["id"]


def _call_chatflow_image(file_id: str, count: int) -> str:
    """Send a chat message referencing an uploaded image; return the answer."""
    settings = get_settings()
    base = settings.dify_api_base.rstrip("/")
    resp = httpx.post(
        f"{base}/v1/chat-messages",
        headers={
            "Authorization": f"Bearer {settings.dify_api_key}",
            "Content-Type": "application/json",
        },
        json={
            "inputs": {"count": count},
            "query": build_image_prompt(count),
            "response_mode": "blocking",
            "user": "geometry-tutor",
            "conversation_id": "",
            "files": [
                {
                    "type": "image",
                    "transfer_method": "local_file",
                    "upload_file_id": file_id,
                }
            ],
        },
        timeout=120.0,
    )
    resp.raise_for_status()
    return resp.json().get("answer", "")


def solve_with_dify(
    question: str, count: int
) -> Optional[tuple[Problem, list[Problem], list[str]]]:
    """Return (original, practice, concept_review) or ``None`` if unavailable."""
    if not dify_available():
        return None

    last_err: Optional[Exception] = None
    for _ in range(2):  # one retry on parse failure
        try:
            raw = _call_chatflow(question, count)
            payload = LLMPayload.model_validate(loads_lenient(strip_fences(raw)))
            return to_result(payload, count)
        except (json.JSONDecodeError, ValidationError, KeyError, httpx.HTTPError) as exc:
            last_err = exc
            continue
    print(f"[dify] fallback failed: {last_err}")
    return None


def solve_image_with_dify(
    content: bytes, filename: str, content_type: str, count: int
) -> Optional[tuple[Problem, list[Problem], list[str]]]:
    """Upload a photo of a problem to Dify, solve it, and return practice.

    Returns (original, practice, concept_review) or ``None`` if unavailable/failed.
    """
    if not dify_available():
        return None

    try:
        file_id = _upload_file(content, filename, content_type)
    except httpx.HTTPError as exc:
        print(f"[dify] image upload failed: {exc}")
        return None

    last_err: Optional[Exception] = None
    for _ in range(2):  # one retry on parse failure
        try:
            raw = _call_chatflow_image(file_id, count)
            payload = LLMPayload.model_validate(loads_lenient(strip_fences(raw)))
            return to_result(payload, count)
        except (json.JSONDecodeError, ValidationError, KeyError, httpx.HTTPError) as exc:
            last_err = exc
            continue
    print(f"[dify] image solve failed: {last_err}")
    return None
