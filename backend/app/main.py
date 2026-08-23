"""FastAPI application for the geometry tutor."""
from __future__ import annotations

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .checker import check_answer
from .classifier import classify
from .config import get_settings
from .analysis import (
    analysis_units,
    practice_analysis_topic,
    solve_analysis_image,
    solve_analysis_question,
)
from .dify import dify_available, solve_image_with_dify
from .llm import (
    active_provider,
    chat_reply,
    llm_available,
    local_vision_available,
    solve_fallback,
    solve_image_local,
)
from .models import (
    AnalysisSolveRequest,
    AnalysisTopicRequest,
    ChatRequest,
    ChatResponse,
    CheckRequest,
    CheckResponse,
    GenerateMoreRequest,
    GenerateMoreResponse,
    SolveRequest,
    SolveResponse,
)
from .prompts import build_analysis_image_prompt, build_image_prompt
from .templates import (
    generate_problems,
    get_template,
    template_concept_review,
    template_title,
)

settings = get_settings()

app = FastAPI(title="Geometry Tutor API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict:
    return {
        "status": "ok",
        "fallback_provider": active_provider(),
        "fallback_enabled": llm_available(),
    }


def _ai_source() -> str:
    """Response source label reflecting the active AI provider."""
    return "dify" if active_provider() == "dify" else "llm"


def _vision_enabled() -> bool:
    return local_vision_available() or dify_available()


def _solve_photo(
    content: bytes, filename: str, content_type: str, count: int, analysis: bool
):
    """Read + solve a photographed problem, preferring a local vision model.

    Falls back to Dify's vision app when local vision isn't configured.
    Returns (original, practice, review) or None.
    """
    if local_vision_available():
        prompt = (
            build_analysis_image_prompt(count)
            if analysis
            else build_image_prompt(count)
        )
        return solve_image_local(content, content_type, count, prompt=prompt)
    if dify_available():
        if analysis:
            return solve_analysis_image(content, filename, content_type, count)
        return solve_image_with_dify(content, filename, content_type, count)
    return None


@app.post("/api/solve", response_model=SolveResponse)
def solve(req: SolveRequest) -> SolveResponse:
    topic = classify(req.question)

    if topic is not None:
        template = get_template(topic)
        if template is not None:
            # The "original" is a freshly generated exemplar of the matched
            # topic; practice problems are additional similar ones.
            original = template.generate(1)[0]
            practice = template.generate(req.count)
            # Try to also solve the EXACT question the student typed via AI so
            # the "Solutions" tab answers their specific problem (not just a
            # similar example). Best-effort: skipped if the AI is unavailable.
            asked = None
            ai_result = solve_fallback(req.question, 1)
            if ai_result is not None:
                asked = ai_result[1]
            return SolveResponse(
                source="template",
                topic=topic,
                original=original,
                practice=practice,
                concept_review=template_concept_review(topic),
                asked_solution=asked,
            )

    # No template matched -> route to the configured fallback (Dify or LLM).
    result = solve_fallback(req.question, req.count)
    if result is not None:
        source, original, practice, review = result
        return SolveResponse(
            source=source,
            topic="general",
            original=original,
            practice=practice,
            concept_review=review,
            asked_solution=original,
        )

    raise HTTPException(
        status_code=422,
        detail=(
            "I couldn't recognize that as one of the supported geometry topics, "
            "and the AI fallback is not configured. Try asking about the "
            "Pythagorean theorem, triangle/rectangle/circle area, angles, "
            "similar triangles, or distance/midpoint."
        ),
    )


@app.post("/api/solve-image", response_model=SolveResponse)
async def solve_image(
    image: UploadFile = File(...),
    count: int = Form(default=4),
) -> SolveResponse:
    if not _vision_enabled():
        raise HTTPException(
            status_code=422,
            detail=(
                "Solving from a photo needs a vision model. Configure a local "
                "vision model (LLM_VISION_MODEL via Ollama) or Dify in the .env."
            ),
        )

    content_type = image.content_type or "image/jpeg"
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=422, detail="Please upload an image file.")

    content = await image.read()
    if not content:
        raise HTTPException(status_code=422, detail="The uploaded image is empty.")
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=422, detail="Image too large (max 10 MB).")

    count = max(1, min(count, 8))
    result = _solve_photo(
        content, image.filename or "problem.jpg", content_type, count, analysis=False
    )
    if result is None:
        raise HTTPException(
            status_code=502,
            detail=(
                "Could not read or solve the problem from the photo. Try a "
                "clearer image, or type the question instead."
            ),
        )

    original, practice, review = result
    return SolveResponse(
        source=_ai_source(),
        topic="photo",
        original=original,
        practice=practice,
        concept_review=review,
        asked_solution=original,
    )


@app.post("/api/generate-more", response_model=GenerateMoreResponse)
def generate_more(req: GenerateMoreRequest) -> GenerateMoreResponse:
    problems = generate_problems(req.topic, req.count)
    if not problems:
        raise HTTPException(
            status_code=422,
            detail="More problems can only be generated for template-based topics.",
        )
    return GenerateMoreResponse(
        source="template",
        topic=req.topic,
        practice=problems,
        concept_review=template_concept_review(req.topic),
    )


@app.post("/api/check", response_model=CheckResponse)
def check(req: CheckRequest) -> CheckResponse:
    correct, feedback = check_answer(req.expected, req.submitted)
    return CheckResponse(correct=correct, feedback=feedback)


@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    if not llm_available():
        raise HTTPException(
            status_code=422,
            detail=(
                "Chat needs an AI provider. Configure a local model (Ollama) or "
                "Dify in the backend .env."
            ),
        )
    answer = chat_reply(
        req.question,
        context=req.context,
        history=[t.model_dump() for t in req.history],
    )
    if not answer:
        raise HTTPException(
            status_code=502,
            detail="Sorry, I couldn't answer that right now. Please try again.",
        )
    return ChatResponse(answer=answer)


@app.get("/api/topics")
def topics() -> dict:
    from .templates import known_topics

    return {t: template_title(t) for t in known_topics()}


@app.get("/api/topics-grouped")
def topics_grouped() -> dict:
    from .templates import grouped_topics

    return {"units": grouped_topics()}


# ---------------------------------------------------------------------------
# Analysis Honors (AI-only subject)
# ---------------------------------------------------------------------------
def _require_ai() -> None:
    if not llm_available():
        raise HTTPException(
            status_code=422,
            detail=(
                "The Analysis helper needs an AI provider. Configure Dify or a "
                "direct/local LLM (e.g. Ollama via LLM_API_BASE) in the backend .env."
            ),
        )


@app.get("/api/analysis-topics")
def analysis_topics() -> dict:
    return {"units": analysis_units()}


@app.post("/api/analysis/solve", response_model=SolveResponse)
def analysis_solve(req: AnalysisSolveRequest) -> SolveResponse:
    _require_ai()
    result = solve_analysis_question(req.question, req.count)
    if result is None:
        raise HTTPException(
            status_code=502,
            detail="The AI tutor could not answer that Analysis question. Try rephrasing.",
        )
    original, practice, review = result
    return SolveResponse(
        source=_ai_source(),
        topic="analysis",
        original=original,
        practice=practice,
        concept_review=review,
        asked_solution=original,
    )


@app.post("/api/analysis/solve-image", response_model=SolveResponse)
async def analysis_solve_image(
    image: UploadFile = File(...),
    count: int = Form(default=4),
) -> SolveResponse:
    if not _vision_enabled():
        raise HTTPException(
            status_code=422,
            detail=(
                "Reading a photo needs a vision model. Configure a local vision "
                "model (LLM_VISION_MODEL via Ollama) or Dify in the .env."
            ),
        )

    content_type = image.content_type or "image/jpeg"
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=422, detail="Please upload an image file.")

    content = await image.read()
    if not content:
        raise HTTPException(status_code=422, detail="The uploaded image is empty.")
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=422, detail="Image too large (max 10 MB).")

    count = max(1, min(count, 8))
    result = _solve_photo(
        content, image.filename or "problem.jpg", content_type, count, analysis=True
    )
    if result is None:
        raise HTTPException(
            status_code=502,
            detail=(
                "Could not read or solve the Analysis problem from the photo. "
                "Try a clearer image, or type the question instead."
            ),
        )

    original, practice, review = result
    return SolveResponse(
        source=_ai_source(),
        topic="analysis",
        original=original,
        practice=practice,
        concept_review=review,
        asked_solution=original,
    )


@app.post("/api/analysis/practice", response_model=SolveResponse)
def analysis_practice(req: AnalysisTopicRequest) -> SolveResponse:
    _require_ai()
    result = practice_analysis_topic(req.topic, req.count)
    if result is None:
        raise HTTPException(
            status_code=502,
            detail="The AI tutor could not generate practice for that topic. Try again.",
        )
    original, practice, review = result
    return SolveResponse(
        source=_ai_source(),
        topic="analysis",
        original=original,
        practice=practice,
        concept_review=review,
    )
