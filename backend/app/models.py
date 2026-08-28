"""Pydantic models shared across the geometry tutor backend."""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Diagram specs (rendered as SVG on the frontend)
# ---------------------------------------------------------------------------
class TriangleDiagram(BaseModel):
    kind: Literal["triangle"] = "triangle"
    # Labels for the three sides / vertices, any of which may be omitted.
    a: Optional[float] = None
    b: Optional[float] = None
    c: Optional[float] = None
    right_angle: bool = False
    labels: dict[str, str] = Field(default_factory=dict)


class CircleDiagram(BaseModel):
    kind: Literal["circle"] = "circle"
    radius: Optional[float] = None
    diameter: Optional[float] = None
    labels: dict[str, str] = Field(default_factory=dict)


class RectangleDiagram(BaseModel):
    kind: Literal["rectangle"] = "rectangle"
    width: Optional[float] = None
    height: Optional[float] = None
    labels: dict[str, str] = Field(default_factory=dict)


class CoordinateDiagram(BaseModel):
    kind: Literal["coordinate"] = "coordinate"
    points: list[tuple[float, float]] = Field(default_factory=list)
    labels: list[str] = Field(default_factory=list)


Diagram = TriangleDiagram | CircleDiagram | RectangleDiagram | CoordinateDiagram


# ---------------------------------------------------------------------------
# Problems
# ---------------------------------------------------------------------------
class Problem(BaseModel):
    id: str
    prompt: str
    answer: str
    # Worked solution steps rendered with KaTeX on the frontend.
    steps: list[str] = Field(default_factory=list)
    # A short unit string ("cm", "units", "degrees") for display / checking.
    unit: Optional[str] = None
    diagram: Optional[Diagram] = None


# ---------------------------------------------------------------------------
# API request / response
# ---------------------------------------------------------------------------
class SolveRequest(BaseModel):
    question: str = Field(..., min_length=1)
    count: int = Field(default=4, ge=1, le=8)


class SolveResponse(BaseModel):
    source: Literal["template", "llm", "dify", "gunn"]
    topic: str
    original: Problem
    practice: list[Problem]
    # Short review of the underlying concepts, shown before the worked example.
    concept_review: list[str] = Field(default_factory=list)
    # Step-by-step solution to the EXACT question the student typed (may differ
    # from ``original``, which for templates is a similar generated example).
    asked_solution: Optional[Problem] = None


class GenerateMoreRequest(BaseModel):
    topic: str
    count: int = Field(default=4, ge=1, le=8)


class GenerateMoreResponse(BaseModel):
    source: Literal["template", "llm"]
    topic: str
    practice: list[Problem]
    concept_review: list[str] = Field(default_factory=list)


class CheckRequest(BaseModel):
    expected: str
    submitted: str


class CheckResponse(BaseModel):
    correct: bool
    feedback: str


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1)
    # Optional background about what the student is currently viewing.
    context: Optional[str] = None
    # Prior conversation turns for follow-up questions.
    history: list[ChatTurn] = Field(default_factory=list)


class ChatResponse(BaseModel):
    answer: str


# ---------------------------------------------------------------------------
# Analysis (AI-only subject)
# ---------------------------------------------------------------------------
class AnalysisSolveRequest(BaseModel):
    question: str = Field(..., min_length=1)
    count: int = Field(default=4, ge=1, le=8)


class AnalysisTopicRequest(BaseModel):
    topic: str = Field(..., min_length=1)
    count: int = Field(default=4, ge=1, le=8)


class AnalysisMoreRequest(BaseModel):
    topic: str = Field(..., min_length=1)
    # How many practice problems the client already has for this topic, so we
    # can serve the next slice from the cached bank.
    have: int = Field(default=0, ge=0)
    count: int = Field(default=4, ge=1, le=8)


class AnalysisMoreResponse(BaseModel):
    # "gunn" = served from the cached bank; "llm" = freshly AI-generated.
    source: Literal["gunn", "llm"]
    topic: str
    practice: list[Problem]
    # True when more cached problems remain beyond what was just returned.
    more_available: bool = False
