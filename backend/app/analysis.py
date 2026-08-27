"""Analysis Honors course structure and Dify-backed solving.

Unlike Geometry, Analysis topics are conceptual (induction, limits, series,
proofs, etc.), so there are no numeric templates: every Analysis request is
routed to the Dify AI provider. This module holds the curriculum outline used
by the topic browser and helpers to build Analysis prompts.
"""
from __future__ import annotations

from typing import Optional

from .dify import _upload_file, dify_available
from .llm import llm_available, raw_chat_query
from .models import Problem
from .prompts import (
    LLMPayload,
    build_analysis_image_prompt,
    loads_lenient,
    strip_fences,
    to_result,
)

import json

import httpx
from pydantic import ValidationError

# Analysis Honors units, mirroring the Gunn Maths course
# (https://www.gunnmaths.org/analysis). Most units are a single browsable
# topic; AtPS is split into subsections so its large problem set is grouped.
# Each topic id maps to cached content built from real past quizzes/tests.
_ANALYSIS_UNITS: list[tuple[str, list[str]]] = [
    (
        "Algebra Through Problem Solving (AtPS)",
        [
            "AtPS: Triangles & Pascal's Triangle",
            "AtPS: Sequences, Series & Sigma Notation",
            "AtPS: Binomial Theorem & Fibonacci",
        ],
    ),
    (
        "Other Analysis Units",
        [
            "Probability",
            "Polar and 3D",
            "Vectors and Parametrics",
            "Growth",
            "Matrices",
            "A Geometric Approach to Matrices (GAtM)",
            "Limits and Calculus",
        ],
    ),
]


def analysis_units() -> list[dict]:
    """Return Analysis units with their topics for the topic browser."""
    return [
        {"unit": name, "topics": [{"id": t, "title": t} for t in topics]}
        for name, topics in _ANALYSIS_UNITS
    ]


_MATH_INSTRUCTION = (
    "Formatting: write ALL mathematics using LaTeX wrapped in \\( \\) for inline "
    "math and \\[ \\] for displayed equations, e.g. \\(F_{n} = F_{n-1} + F_{n-2}\\). "
    "Never write bare LaTeX like F_0 or \\ge outside of \\( \\). Plain sentences "
    "should stay as normal words."
)

_REVIEW_INSTRUCTION = (
    "Also include a 'concept_review': a short list of 2-4 bullet points reviewing "
    "the key concepts, definitions, and formulas a student needs for this problem, "
    "written before the solution."
)


def _build_analysis_query(question: str, count: int) -> str:
    return (
        "This is a high school Analysis (Honors) course question, covering topics "
        "like induction, series, polar/3-D graphing, probability, matrices, "
        "vectors, groups, limits, and derivatives.\n\n"
        f"Student question: {question}\n\n"
        f"Solve it step by step in 'original', then produce {count} similar "
        "practice problems in 'practice'. "
        + _REVIEW_INSTRUCTION
        + " "
        + _MATH_INSTRUCTION
        + " Return JSON only."
    )


def _build_topic_query(topic: str, count: int) -> str:
    return (
        f"Create a worked example problem about the Analysis (Honors) topic "
        f"'{topic}'. Put the worked example in 'original' (with step-by-step "
        f"'steps'), then produce {count} similar practice problems in 'practice'. "
        + _REVIEW_INSTRUCTION
        + " "
        + _MATH_INSTRUCTION
        + " Return JSON only."
    )


def _solve_query(
    query: str, count: int
) -> Optional[tuple[Problem, list[Problem], list[str]]]:
    if not llm_available():
        return None
    last_err: Optional[Exception] = None
    for _ in range(2):
        try:
            # Route through the active provider (Dify or a direct/local LLM)
            # with our analysis-specific query.
            raw = raw_chat_query(query, count)
            payload = LLMPayload.model_validate(loads_lenient(strip_fences(raw)))
            return to_result(payload, count)
        except (json.JSONDecodeError, ValidationError, KeyError, httpx.HTTPError) as exc:
            last_err = exc
            continue
    print(f"[analysis] solve failed: {last_err}")
    return None


def solve_analysis_question(
    question: str, count: int
) -> Optional[tuple[Problem, list[Problem], list[str]]]:
    return _solve_query(_build_analysis_query(question, count), count)


def practice_analysis_topic(
    topic: str, count: int
) -> Optional[tuple[Problem, list[Problem], list[str]]]:
    return _solve_query(_build_topic_query(topic, count), count)


def _call_analysis_image_chat(file_id: str, count: int) -> str:
    from .config import get_settings

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
            "query": build_analysis_image_prompt(count),
            "response_mode": "blocking",
            "user": "analysis-helper",
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


def solve_analysis_image(
    content: bytes, filename: str, content_type: str, count: int
) -> Optional[tuple[Problem, list[Problem], list[str]]]:
    """Upload a photo of an Analysis problem to Dify and solve it."""
    if not dify_available():
        return None

    try:
        file_id = _upload_file(content, filename, content_type)
    except httpx.HTTPError as exc:
        print(f"[analysis] image upload failed: {exc}")
        return None

    last_err: Optional[Exception] = None
    for _ in range(2):
        try:
            raw = _call_analysis_image_chat(file_id, count)
            payload = LLMPayload.model_validate(loads_lenient(strip_fences(raw)))
            return to_result(payload, count)
        except (json.JSONDecodeError, ValidationError, KeyError, httpx.HTTPError) as exc:
            last_err = exc
            continue
    print(f"[analysis] image solve failed: {last_err}")
    return None
