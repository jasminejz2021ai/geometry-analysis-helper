"""Base classes and helpers for problem templates."""
from __future__ import annotations

import uuid
from abc import ABC, abstractmethod

from ..models import Problem


def new_id() -> str:
    return uuid.uuid4().hex[:12]


def fmt(value: float) -> str:
    """Format a number without a trailing ``.0`` for whole numbers."""
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return f"{value:.2f}".rstrip("0").rstrip(".")


class Template(ABC):
    """A geometry problem template.

    ``topic`` is the classifier id. ``generate`` returns ``n`` randomized
    problems similar to whatever the student asked about.
    """

    topic: str
    title: str

    @abstractmethod
    def generate(self, n: int) -> list[Problem]:  # pragma: no cover - interface
        ...
