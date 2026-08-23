"""Answer checking with numeric tolerance and normalized string compare."""
from __future__ import annotations

import re
from typing import Optional

_NUM_RE = re.compile(r"-?\d+(?:\.\d+)?(?:/\d+(?:\.\d+)?)?")


def _to_float(token: str) -> Optional[float]:
    token = token.strip()
    if not token:
        return None
    # Support simple fractions like "3/4".
    if "/" in token:
        try:
            num, den = token.split("/", 1)
            return float(num) / float(den)
        except (ValueError, ZeroDivisionError):
            return None
    try:
        return float(token)
    except ValueError:
        return None


def _extract_numbers(text: str) -> list[float]:
    out: list[float] = []
    for m in _NUM_RE.findall(text):
        val = _to_float(m)
        if val is not None:
            out.append(val)
    return out


def _normalize(text: str) -> str:
    return re.sub(r"\s+", "", text.strip().lower())


def check_answer(expected: str, submitted: str, *, tol: float = 1e-2) -> tuple[bool, str]:
    """Return (correct, feedback).

    Strategy:
    1. Try to compare the primary numeric values with tolerance.
    2. Fall back to a normalized string comparison.
    """
    submitted = (submitted or "").strip()
    if not submitted:
        return False, "Please enter an answer."

    exp_nums = _extract_numbers(expected)
    sub_nums = _extract_numbers(submitted)

    if exp_nums and sub_nums:
        # Compare the first numeric value found in each (answers are single-valued).
        exp_val = exp_nums[0]
        # Accept the submitted value if any number the student typed matches.
        for sv in sub_nums:
            denom = max(abs(exp_val), 1.0)
            if abs(sv - exp_val) <= tol * denom or abs(sv - exp_val) <= tol:
                return True, "Correct! Nicely done."
        return False, f"Not quite. The correct answer is {expected}."

    # Non-numeric answers: normalized string compare.
    if _normalize(expected) == _normalize(submitted):
        return True, "Correct! Nicely done."
    return False, f"Not quite. The correct answer is {expected}."
