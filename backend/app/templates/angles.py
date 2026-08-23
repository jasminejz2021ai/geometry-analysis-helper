"""Angle relationship templates: complementary, supplementary, triangle sum."""
from __future__ import annotations

import random

from ..models import Problem
from .base import Template, fmt, new_id


class AnglesTemplate(Template):
    topic = "angles"
    title = "Angle Relationships"

    def generate(self, n: int) -> list[Problem]:
        problems: list[Problem] = []
        for _ in range(n):
            kind = random.choice(["complementary", "supplementary", "triangle"])
            if kind == "complementary":
                given = random.randint(10, 80)
                other = 90 - given
                prompt = (
                    f"Two angles are complementary. One angle measures {given} degrees. "
                    "Find the other angle."
                )
                steps = [
                    r"\text{Complementary angles sum to } 90^\circ.",
                    rf"x = 90 - {given}",
                    rf"x = {fmt(other)}^\circ",
                ]
                answer = f"{fmt(other)} degrees"
            elif kind == "supplementary":
                given = random.randint(20, 160)
                other = 180 - given
                prompt = (
                    f"Two angles are supplementary. One angle measures {given} degrees. "
                    "Find the other angle."
                )
                steps = [
                    r"\text{Supplementary angles sum to } 180^\circ.",
                    rf"x = 180 - {given}",
                    rf"x = {fmt(other)}^\circ",
                ]
                answer = f"{fmt(other)} degrees"
            else:
                a = random.randint(30, 100)
                b = random.randint(20, 170 - a)
                c = 180 - a - b
                prompt = (
                    f"Two angles of a triangle measure {a} degrees and {b} degrees. "
                    "Find the third angle."
                )
                steps = [
                    r"\text{The angles of a triangle sum to } 180^\circ.",
                    rf"x = 180 - {a} - {b}",
                    rf"x = {fmt(c)}^\circ",
                ]
                answer = f"{fmt(c)} degrees"

            problems.append(
                Problem(
                    id=new_id(),
                    prompt=prompt,
                    answer=answer,
                    steps=steps,
                    unit="degrees",
                )
            )
        return problems
