"""Arc length and sector area of a circle."""
from __future__ import annotations

import math
import random

from ..models import CircleDiagram, Problem
from .base import Template, fmt, new_id

_ANGLES = [30, 45, 60, 90, 120, 135, 150, 180, 270]


class ArcSectorTemplate(Template):
    topic = "arc_sector"
    title = "Arc Length & Sector Area"

    def generate(self, n: int) -> list[Problem]:
        problems: list[Problem] = []
        for _ in range(n):
            radius = random.randint(3, 12)
            angle = random.choice(_ANGLES)
            want_arc = random.random() < 0.5
            if want_arc:
                arc = (angle / 360) * 2 * math.pi * radius
                prompt = (
                    f"A circle has radius {radius} cm. Find the length of an arc "
                    f"that subtends a central angle of {angle}\u00b0."
                )
                steps = [
                    r"\text{Arc length} = \frac{\theta}{360^\circ}\cdot 2\pi r",
                    rf"= \frac{{{angle}}}{{360}}\cdot 2\pi\cdot {radius}",
                    rf"= {fmt(arc)}\ \text{{cm}}",
                ]
                answer = f"{fmt(arc)} cm"
                unit = "cm"
            else:
                sector = (angle / 360) * math.pi * radius**2
                prompt = (
                    f"A circle has radius {radius} cm. Find the area of a sector "
                    f"with a central angle of {angle}\u00b0."
                )
                steps = [
                    r"\text{Sector area} = \frac{\theta}{360^\circ}\cdot \pi r^2",
                    rf"= \frac{{{angle}}}{{360}}\cdot \pi\cdot {radius}^2",
                    rf"= {fmt(sector)}\ \text{{cm}}^2",
                ]
                answer = f"{fmt(sector)} cm^2"
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
