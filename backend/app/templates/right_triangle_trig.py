"""Right triangle trigonometry: SOH-CAH-TOA to find a missing side."""
from __future__ import annotations

import math
import random

from ..models import Problem, TriangleDiagram
from .base import Template, fmt, new_id


class RightTriangleTrigTemplate(Template):
    topic = "right_triangle_trig"
    title = "Right Triangle Trigonometry"

    def generate(self, n: int) -> list[Problem]:
        problems: list[Problem] = []
        for _ in range(n):
            angle = random.choice([25, 30, 35, 40, 45, 50, 55, 60, 65])
            hyp = random.randint(8, 25)
            kind = random.choice(["sin", "cos", "tan"])

            if kind == "sin":
                # opposite = hyp * sin(angle)
                opp = hyp * math.sin(math.radians(angle))
                prompt = (
                    f"In a right triangle, the hypotenuse is {hyp} cm and one "
                    f"acute angle is {angle} degrees. Find the length of the side "
                    "opposite that angle. Round to two decimals."
                )
                steps = [
                    r"\sin(\theta) = \frac{\text{opposite}}{\text{hypotenuse}}",
                    rf"\text{{opposite}} = {hyp} \cdot \sin({angle}^\circ)",
                    rf"\approx {fmt(round(opp, 2))}\ \text{{cm}}",
                ]
                answer = f"{fmt(round(opp, 2))} cm"
            elif kind == "cos":
                adj = hyp * math.cos(math.radians(angle))
                prompt = (
                    f"In a right triangle, the hypotenuse is {hyp} cm and one "
                    f"acute angle is {angle} degrees. Find the length of the side "
                    "adjacent to that angle. Round to two decimals."
                )
                steps = [
                    r"\cos(\theta) = \frac{\text{adjacent}}{\text{hypotenuse}}",
                    rf"\text{{adjacent}} = {hyp} \cdot \cos({angle}^\circ)",
                    rf"\approx {fmt(round(adj, 2))}\ \text{{cm}}",
                ]
                answer = f"{fmt(round(adj, 2))} cm"
            else:
                adj = random.randint(5, 18)
                opp = adj * math.tan(math.radians(angle))
                prompt = (
                    f"In a right triangle, the side adjacent to a {angle} degree "
                    f"angle is {adj} cm. Find the length of the side opposite that "
                    "angle. Round to two decimals."
                )
                steps = [
                    r"\tan(\theta) = \frac{\text{opposite}}{\text{adjacent}}",
                    rf"\text{{opposite}} = {adj} \cdot \tan({angle}^\circ)",
                    rf"\approx {fmt(round(opp, 2))}\ \text{{cm}}",
                ]
                answer = f"{fmt(round(opp, 2))} cm"

            problems.append(
                Problem(
                    id=new_id(),
                    prompt=prompt,
                    answer=answer,
                    steps=steps,
                    unit="cm",
                    diagram=TriangleDiagram(
                        right_angle=True,
                        labels={"a": "", "b": "", "c": f"{angle}°"},
                    ),
                )
            )
        return problems
