"""Precomputed answers for the fixed "Try an example" questions.

The example questions shown in the UI are static, so we can solve them once and
serve the cached ``SolveResponse`` instantly instead of waiting on the (slow)
local model each time. The cache is a JSON file committed alongside the app so
it works both locally and on the deployed backend.

Refresh it by running ``python -m app.warm_cache`` while the AI provider is up.
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Optional

# Keep these in sync with the frontend example chips (QuestionInput.tsx).
GEOMETRY_EXAMPLES: list[str] = [
    "Find the hypotenuse of a right triangle with legs 6 and 8",
    "What is the area of a circle with radius 5?",
    "Two angles are complementary and one is 35 degrees",
    "Find the distance between (1, 2) and (4, 6)",
    "Area of a triangle with base 10 and height 7",
]

ANALYSIS_EXAMPLES: list[str] = [
    "Prove 1 + 2 + ... + n = n(n+1)/2 by induction",
    "Prove a Fibonacci identity by induction",
    "Does the series sum of 1/n^2 converge?",
    "Find the derivative of x^3 using the limit definition",
    "Find the cross product of <1,2,3> and <4,5,6>",
    "Evaluate the limit of (sin x)/x as x approaches 0",
]

_CACHE_PATH = Path(__file__).with_name("example_answers.json")


def normalize(question: str) -> str:
    """Loose key so trivial whitespace/case differences still hit the cache."""
    return re.sub(r"\s+", " ", (question or "").strip().lower())


def _load() -> dict[str, dict]:
    try:
        with _CACHE_PATH.open("r", encoding="utf-8") as fh:
            return json.load(fh)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


# Loaded once at import; refreshed in-process when warm_cache writes new data.
_CACHE: dict[str, dict] = _load()


def get_cached(question: str) -> Optional[dict]:
    """Return the cached SolveResponse dict for a known example, or None."""
    return _CACHE.get(normalize(question))


def save_cache(entries: dict[str, dict]) -> None:
    """Persist the cache to disk and update the in-memory copy."""
    with _CACHE_PATH.open("w", encoding="utf-8") as fh:
        json.dump(entries, fh, ensure_ascii=False, indent=2)
    _CACHE.clear()
    _CACHE.update(entries)


def all_examples() -> list[tuple[str, bool]]:
    """(question, is_analysis) for every cacheable example."""
    return [(q, False) for q in GEOMETRY_EXAMPLES] + [
        (q, True) for q in ANALYSIS_EXAMPLES
    ]
