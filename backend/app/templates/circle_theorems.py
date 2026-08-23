"""Circle theorems: inscribed angle, central angle/arc, and tangent-radius."""
from __future__ import annotations

import random

from ..models import CircleDiagram, Problem
from .base import Template, fmt, new_id


class CircleTheoremsTemplate(Template):
    topic = "circle_theorems"
    title = "Circle Theorems"

    def generate(self, n: int) -> list[Problem]:
        problems: list[Problem] = []
        for _ in range(n):
            kind = random.choice(["inscribed", "central", "tangent"])
            if kind == "inscribed":
                arc = random.choice([40, 60, 80, 100, 120, 140, 160])
                inscribed = arc / 2
                prompt = (
                    f"An inscribed angle in a circle intercepts an arc of "
                    f"{arc} degrees. Find the measure of the inscribed angle."
                )
                steps = [
                    r"\text{Inscribed angle} = \tfrac{1}{2} \cdot \text{intercepted arc}.",
                    rf"= \tfrac{{1}}{{2}} \cdot {arc}",
                    rf"= {fmt(inscribed)}^\circ",
                ]
                answer = f"{fmt(inscribed)} degrees"
            elif kind == "central":
                inscribed = random.choice([20, 25, 30, 35, 40, 45, 55])
                arc = inscribed * 2
                prompt = (
                    f"An inscribed angle measures {inscribed} degrees. Find the "
                    "measure of its intercepted arc."
                )
                steps = [
                    r"\text{Intercepted arc} = 2 \cdot \text{inscribed angle}.",
                    rf"= 2 \cdot {inscribed}",
                    rf"= {fmt(arc)}^\circ",
                ]
                answer = f"{fmt(arc)} degrees"
            else:
                other = random.choice([35, 40, 50, 55, 60, 65, 70])
                result = 90 - other
                prompt = (
                    "A tangent line meets a radius at the point of tangency. In the "
                    f"triangle formed, one acute angle is {other} degrees. Find the "
                    "other acute angle (the tangent is perpendicular to the radius)."
                )
                steps = [
                    r"\text{A tangent is perpendicular to the radius at the point of tangency.}",
                    r"\text{So the triangle has a } 90^\circ \text{ angle, and the acute angles sum to } 90^\circ.",
                    rf"x = 90 - {other} = {fmt(result)}^\circ",
                ]
                answer = f"{fmt(result)} degrees"

            problems.append(
                Problem(
                    id=new_id(),
                    prompt=prompt,
                    answer=answer,
                    steps=steps,
                    unit="degrees",
                    diagram=CircleDiagram(radius=1.0, labels={}),
                )
            )
        return problems
