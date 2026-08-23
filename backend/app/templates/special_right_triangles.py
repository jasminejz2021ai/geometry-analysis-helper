"""Special right triangles: 30-60-90 and 45-45-90."""
from __future__ import annotations

import random

from ..models import Problem, TriangleDiagram
from .base import Template, fmt, new_id


class SpecialRightTrianglesTemplate(Template):
    topic = "special_right_triangles"
    title = "Special Right Triangles"

    def generate(self, n: int) -> list[Problem]:
        problems: list[Problem] = []
        for _ in range(n):
            if random.random() < 0.5:
                problems.append(self._make_45(random.randint(2, 12)))
            else:
                problems.append(self._make_30_60(random.randint(2, 10)))
        return problems

    def _make_45(self, leg: int) -> Problem:
        # 45-45-90: legs equal, hypotenuse = leg * sqrt(2).
        prompt = (
            f"In a 45-45-90 right triangle, each leg measures {leg} cm. "
            "Find the length of the hypotenuse (leave in simplest radical form)."
        )
        steps = [
            r"\text{In a 45-45-90 triangle, } \text{hyp} = \text{leg} \cdot \sqrt{2}.",
            rf"\text{{hyp}} = {leg}\sqrt{{2}}\ \text{{cm}}",
        ]
        answer = f"{leg}\\sqrt{{2}} cm"
        return Problem(
            id=new_id(),
            prompt=prompt,
            answer=answer,
            steps=steps,
            unit="cm",
            diagram=TriangleDiagram(
                a=float(leg), b=float(leg), right_angle=True,
                labels={"a": f"{leg} cm", "b": f"{leg} cm", "c": "?"},
            ),
        )

    def _make_30_60(self, short: int) -> Problem:
        # 30-60-90: short leg = x, long leg = x*sqrt(3), hyp = 2x.
        find_hyp = random.random() < 0.5
        if find_hyp:
            prompt = (
                f"In a 30-60-90 right triangle, the side opposite the 30 degree "
                f"angle (the short leg) is {short} cm. Find the hypotenuse."
            )
            steps = [
                r"\text{In a 30-60-90 triangle, } \text{hyp} = 2 \cdot \text{short leg}.",
                rf"\text{{hyp}} = 2 \cdot {short} = {fmt(2 * short)}\ \text{{cm}}",
            ]
            answer = f"{fmt(2 * short)} cm"
        else:
            prompt = (
                f"In a 30-60-90 right triangle, the side opposite the 30 degree "
                f"angle (the short leg) is {short} cm. Find the longer leg "
                "(opposite 60 degrees, in simplest radical form)."
            )
            steps = [
                r"\text{Long leg} = \text{short leg} \cdot \sqrt{3}.",
                rf"\text{{long leg}} = {short}\sqrt{{3}}\ \text{{cm}}",
            ]
            answer = f"{short}\\sqrt{{3}} cm"
        return Problem(
            id=new_id(),
            prompt=prompt,
            answer=answer,
            steps=steps,
            unit="cm",
            diagram=TriangleDiagram(
                a=float(short), right_angle=True,
                labels={"a": f"{short} cm", "b": "?", "c": ""},
            ),
        )
