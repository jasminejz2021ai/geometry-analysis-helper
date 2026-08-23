"""Shared prompt text, response schema, and parsing helpers.

Used by both the direct LLM fallback (``llm.py``) and the Dify chatflow
fallback (``dify.py``) so they agree on the expected JSON shape.
"""
from __future__ import annotations

from pydantic import BaseModel

from .models import Problem
from .templates.base import new_id


class LLMProblem(BaseModel):
    prompt: str
    answer: str
    steps: list[str] = []


class LLMPayload(BaseModel):
    original: LLMProblem
    practice: list[LLMProblem]
    concept_review: list[str] = []


SYSTEM_PROMPT = (
    "You are a high school geometry tutor. Given a student's question, you solve it "
    "and create similar practice problems. Respond with STRICT JSON only, no prose, "
    "no markdown fences. The JSON schema is:\n"
    "{\n"
    '  "concept_review": [str, ...],\n'
    '  "original": {"prompt": str, "answer": str, "steps": [str, ...]},\n'
    '  "practice": [{"prompt": str, "answer": str, "steps": [str, ...]}, ...]\n'
    "}\n"
    "concept_review is a short list (2-4 bullet points) reviewing the key math "
    "concepts, definitions, and formulas needed for this question, written for a "
    "student before they see the solution. "
    "Each element of steps is a single worked step. You may use LaTeX inside steps "
    "(without surrounding $). Keep answers concise and include units when relevant."
)


def build_user_prompt(question: str, count: int) -> str:
    return (
        f"Student question: {question}\n\n"
        f"First write a short 'concept_review' (2-4 bullets) of the concepts and "
        f"formulas needed, then solve it in 'original', then produce {count} similar "
        "practice problems in 'practice'. Return JSON only."
    )


def build_image_prompt(count: int) -> str:
    return (
        "The attached image is a photo of a geometry problem. Read the problem "
        "from the image, restate it clearly in the 'original.prompt' field, add a "
        "short 'concept_review' (2-4 bullets) of the concepts/formulas needed, and "
        "solve it step by step in 'original.steps'. Then produce "
        f"{count} similar practice problems in 'practice'. Return JSON only."
    )


def build_analysis_image_prompt(count: int) -> str:
    return (
        "The attached image is a photo of a high school Analysis (Honors) problem "
        "covering topics like induction, series, polar/3-D graphing, probability, "
        "matrices, vectors, groups, limits, or derivatives. Read the problem from "
        "the image, restate it clearly in the 'original.prompt' field, add a short "
        "'concept_review' (2-4 bullets) of the concepts/definitions/formulas "
        "needed, and solve it step by step in 'original.steps'. Then produce "
        f"{count} similar practice problems in 'practice'. When you write math, "
        "wrap it in \\( \\) so it renders. Return JSON only."
    )


def strip_fences(text: str) -> str:
    text = (text or "").strip()
    # Reasoning models (e.g. Qwen3) emit a <think>...</think> block before the
    # answer; drop it so we can parse the JSON that follows.
    if "</think>" in text:
        text = text.rsplit("</think>", 1)[1].strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text
        if text.endswith("```"):
            text = text[:-3]
    # Fall back to the first {...} JSON object if extra prose surrounds it.
    if not text.startswith("{") and "{" in text:
        start = text.find("{")
        end = text.rfind("}")
        if end > start:
            text = text[start : end + 1]
    return text.strip()


# LLMs emit LaTeX inside JSON strings inconsistently: some backslashes are
# lone (\( \frac \ge) and some are already escaped (\\cdots \\ge). We scan
# left-to-right so we can preserve existing \\ pairs while repairing lone ones.
#
# The tricky case is the JSON control escapes \n \t \r \b \f: a lone "\n "
# almost always means a real newline, but "\neq"/"\rho"/"\frac" are LaTeX. So
# we only honor a control escape when it is NOT followed by another letter
# (which would indicate a LaTeX command name); otherwise we double the
# backslash so the LaTeX survives. \" \/ \uXXXX are always genuine JSON.
_JSON_SIMPLE = set('"/u')
_JSON_CONTROL = set("ntrbf")


def _repair_json(text: str) -> str:
    out: list[str] = []
    i = 0
    n = len(text)
    while i < n:
        ch = text[i]
        if ch == "\\" and i + 1 < n:
            nxt = text[i + 1]
            after = text[i + 2] if i + 2 < n else ""
            if nxt == "\\":
                # Existing escaped backslash: keep the pair intact.
                out.append("\\\\")
                i += 2
                continue
            if nxt in _JSON_SIMPLE:
                out.append(ch)
                out.append(nxt)
                i += 2
                continue
            if nxt in _JSON_CONTROL and not after.isalpha():
                # Genuine JSON control escape like "\n " (not "\neq").
                out.append(ch)
                out.append(nxt)
                i += 2
                continue
            # Lone backslash starting LaTeX like \( \frac \ge \neq -> double it.
            out.append("\\\\")
            i += 1
            continue
        out.append(ch)
        i += 1
    return "".join(out)


def loads_lenient(text: str) -> dict:
    """json.loads that protects LaTeX backslash-commands from being parsed as
    JSON control escapes.

    LLMs emit LaTeX like ``\\begin``, ``\\times``, ``\\frac`` inside JSON
    strings. Since ``\\b`` and ``\\t`` are valid JSON escapes (backspace/tab),
    a naive ``json.loads`` silently corrupts them (e.g. ``\\times`` -> tab +
    "imes"). We repair the raw text first so those commands survive, then fall
    back to the plain parse if repair somehow breaks it.
    """
    import json

    try:
        return json.loads(_repair_json(text))
    except json.JSONDecodeError:
        return json.loads(text)


def _clean(text: str) -> str:
    """Collapse stray whitespace/newlines that LLMs leave inside JSON strings.

    Turns runs of whitespace (including real newlines) into single spaces and
    tidies spacing just inside \\[ \\] / \\( \\) math delimiters, so display
    math like "\\[\n F_1+... \n\\]" renders cleanly instead of with gaps.
    """
    import re

    if not text:
        return text
    # LLMs sometimes emit a literal backslash-n (two chars) as a spurious line
    # break right inside display-math delimiters, e.g. "\[\n ... \n\]". These
    # are not valid LaTeX, so drop a \n/\t/\r that sits adjacent to \[ or \].
    text = re.sub(r"(\\\[)\s*\\[ntr]\s*", r"\1", text)
    text = re.sub(r"\s*\\[ntr]\s*(\\\])", r"\1", text)
    text = re.sub(r"\s+", " ", text).strip()
    # Reasoning models occasionally emit a forward slash instead of a backslash
    # for LaTeX commands, e.g. "n /ge 1" or "/frac{a}{b}". Repair the common
    # ones so KaTeX can render them. We only touch a known command list to
    # avoid mangling genuine slashes like "1/2" or "km/h".
    text = re.sub(
        r"(?<![A-Za-z0-9])/(ge|geq|le|leq|ne|neq|times|cdot|div|pm|mp|"
        r"frac|sqrt|sum|prod|int|lim|infty|dots|ldots|cdots|langle|rangle|"
        r"alpha|beta|gamma|delta|theta|pi|lambda|mu|sigma|omega|Delta|Sigma|"
        r"Omega|le|ge|in|notin|subset|cup|cap|forall|exists|Rightarrow|"
        r"rightarrow|to|mapsto|sin|cos|tan|log|ln|binom|begin|end)\b",
        r"\\\1",
        text,
    )
    # A backslash immediately followed by a space is a LaTeX control-space; when
    # it leaks into plain prose (e.g. "= 75\ cm") it renders as a literal "\".
    # Collapse "\ " to a single space so units read cleanly.
    text = re.sub(r"\\ +", " ", text)
    # Remove spaces immediately inside inline/display math delimiters.
    text = re.sub(r"\\\(\s+", r"\\(", text)
    text = re.sub(r"\s+\\\)", r"\\)", text)
    text = re.sub(r"\\\[\s+", r"\\[", text)
    text = re.sub(r"\s+\\\]", r"\\]", text)
    return text


def _to_problem(p: LLMProblem) -> Problem:
    return Problem(
        id=new_id(),
        prompt=_clean(p.prompt),
        answer=_clean(p.answer),
        steps=[_clean(s) for s in p.steps if s and s.strip()],
    )


def to_problems(payload: LLMPayload, count: int) -> tuple[Problem, list[Problem]]:
    original = _to_problem(payload.original)
    practice = [_to_problem(p) for p in payload.practice][:count]
    return original, practice


def to_result(
    payload: LLMPayload, count: int
) -> tuple[Problem, list[Problem], list[str]]:
    """Like ``to_problems`` but also returns the concept review bullets."""
    original, practice = to_problems(payload, count)
    review = [_clean(s) for s in (payload.concept_review or []) if s and s.strip()]
    return original, practice, review
