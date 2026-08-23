"""Coordinate geometry template: distance and midpoint between two points."""
from __future__ import annotations

import math
import random

from ..models import CoordinateDiagram, Problem
from .base import Template, fmt, new_id

# Points chosen so that distances often come out clean via Pythagorean legs.
_LEGS = [(3, 4), (6, 8), (5, 12), (8, 6), (9, 12)]


class DistanceMidpointTemplate(Template):
    topic = "distance_midpoint"
    title = "Distance & Midpoint"

    def generate(self, n: int) -> list[Problem]:
        problems: list[Problem] = []
        for _ in range(n):
            x1 = random.randint(-6, 6)
            y1 = random.randint(-6, 6)
            dx, dy = random.choice(_LEGS)
            if random.random() < 0.5:
                dx = -dx
            if random.random() < 0.5:
                dy = -dy
            x2, y2 = x1 + dx, y1 + dy

            want_midpoint = random.random() < 0.5
            if want_midpoint:
                mx = (x1 + x2) / 2
                my = (y1 + y2) / 2
                prompt = (
                    f"Find the midpoint of the segment joining "
                    f"({x1}, {y1}) and ({x2}, {y2})."
                )
                steps = [
                    r"M = \left(\frac{x_1+x_2}{2}, \frac{y_1+y_2}{2}\right)",
                    rf"= \left(\frac{{{x1}+{x2}}}{{2}}, \frac{{{y1}+{y2}}}{{2}}\right)",
                    rf"= ({fmt(mx)}, {fmt(my)})",
                ]
                answer = f"({fmt(mx)}, {fmt(my)})"
                unit = None
            else:
                dist = math.hypot(dx, dy)
                prompt = (
                    f"Find the distance between the points "
                    f"({x1}, {y1}) and ({x2}, {y2})."
                )
                steps = [
                    r"d = \sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}",
                    rf"= \sqrt{{({x2}-{x1})^2 + ({y2}-{y1})^2}}",
                    rf"= \sqrt{{{dx * dx} + {dy * dy}}}",
                    rf"= \sqrt{{{dx * dx + dy * dy}}} = {fmt(round(dist, 2))}",
                ]
                answer = f"{fmt(round(dist, 2))}"
                unit = "units"

            problems.append(
                Problem(
                    id=new_id(),
                    prompt=prompt,
                    answer=answer,
                    steps=steps,
                    unit=unit,
                    diagram=CoordinateDiagram(
                        points=[(float(x1), float(y1)), (float(x2), float(y2))],
                        labels=[f"({x1}, {y1})", f"({x2}, {y2})"],
                    ),
                )
            )
        return problems
