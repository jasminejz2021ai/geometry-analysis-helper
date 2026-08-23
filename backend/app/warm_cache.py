"""Precompute answers for the fixed example questions and cache them to disk.

Run this once (or whenever you change the example lists) while the AI provider
is reachable:

    cd backend && python -m app.warm_cache

It solves each example with the same pipeline the API uses, then writes
``app/example_answers.json``. After that, the ``/api/solve`` and
``/api/analysis/solve`` endpoints serve those questions instantly.
"""
from __future__ import annotations

import time

from .analysis import solve_analysis_question
from .classifier import classify
from .example_cache import all_examples, normalize, save_cache
from .llm import ai_reachable, solve_fallback
from .models import SolveResponse
from .templates import (
    get_template,
    template_concept_review,
)


def _solve_geometry(question: str, count: int = 4) -> SolveResponse:
    topic = classify(question)
    if topic is not None:
        template = get_template(topic)
        if template is not None:
            original = template.generate(1)[0]
            practice = template.generate(count)
            asked = None
            ai = solve_fallback(question, 1)
            if ai is not None:
                asked = ai[1]
            return SolveResponse(
                source="template",
                topic=topic,
                original=original,
                practice=practice,
                concept_review=template_concept_review(topic),
                asked_solution=asked,
            )
    source, original, practice, review = solve_fallback(question, count)
    return SolveResponse(
        source=source,
        topic="general",
        original=original,
        practice=practice,
        concept_review=review,
        asked_solution=original,
    )


def _solve_analysis(question: str, count: int = 4) -> SolveResponse:
    from .llm import active_provider

    original, practice, review = solve_analysis_question(question, count)
    src = "dify" if active_provider() == "dify" else "llm"
    return SolveResponse(
        source=src,
        topic="analysis",
        original=original,
        practice=practice,
        concept_review=review,
        asked_solution=original,
    )


def main() -> None:
    if not ai_reachable(timeout=5.0):
        raise SystemExit(
            "AI provider is not reachable. Start Ollama (and the tunnel if "
            "remote) before warming the cache."
        )

    entries: dict[str, dict] = {}
    examples = all_examples()
    for i, (question, is_analysis) in enumerate(examples, 1):
        kind = "analysis" if is_analysis else "geometry"
        print(f"[{i}/{len(examples)}] ({kind}) {question}")
        t0 = time.time()
        try:
            resp = (
                _solve_analysis(question) if is_analysis else _solve_geometry(question)
            )
            entries[normalize(question)] = resp.model_dump(mode="json")
            print(f"    ok in {time.time() - t0:.0f}s")
        except Exception as exc:  # keep going; cache what we can
            print(f"    FAILED: {exc}")

    save_cache(entries)
    print(f"\nWrote {len(entries)} cached answers.")


if __name__ == "__main__":
    main()
