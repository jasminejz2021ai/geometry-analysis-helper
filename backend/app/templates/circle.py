"""Circle template: area and circumference."""
from __future__ import annotations

import math
import random

from ..models import CircleDiagram, Problem
from .base import Template, fmt, new_id


class CircleTemplate(Template):
    topic = "circle"
    title = "Circle Area & Circumference"

    def generate(self, n: int) -> list[Problem]:
        problems: list[Problem] = []
        for _ in range(n):
            radius = random.randint(2, 15)
            want_circumference = random.random() < 0.5
            if want_circumference:
                circ = 2 * math.pi * radius
                prompt = (
                    f"A circle has a radius of {radius} cm. "
                    "Find its circumference. Use \u03c0 \u2248 3.14."
                )
                steps = [
                    r"C = 2\pi r",
                    rf"= 2 \cdot \pi \cdot {radius}",
                    rf"\approx 2 \cdot 3.14 \cdot {radius}",
                    rf"\approx {fmt(round(2 * 3.14 * radius, 2))}\ \text{{cm}}",
                ]
                answer = f"{fmt(round(2 * 3.14 * radius, 2))} cm"
                unit = "cm"
            else:
                area = math.pi * radius * radius
                prompt = (
                    f"A circle has a radius of {radius} cm. "
                    "Find its area. Use \u03c0 \u2248 3.14."
                )
                steps = [
                    r"A = \pi r^2",
                    rf"= \pi \cdot {radius}^2",
                    rf"\approx 3.14 \cdot {radius * radius}",
                    rf"\approx {fmt(round(3.14 * radius * radius, 2))}\ \text{{cm}}^2",
                ]
                answer = f"{fmt(round(3.14 * radius * radius, 2))} cm^2"
                unit = "cm^2"

            problems.append(
                Problem(
                    id=new_id(),
                    prompt=prompt,
                    answer=answer,
                    steps=steps,
                    unit=unit,
                    diagram=CircleDiagram(
                        radius=float(radius),
                        labels={"radius": f"r = {radius} cm"},
                    ),
                )
            )
        return problems
