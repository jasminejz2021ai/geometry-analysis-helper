"""Slope of a line through two points, with parallel/perpendicular checks."""
from __future__ import annotations

import random
from fractions import Fraction

from ..models import CoordinateDiagram, Problem
from .base import Template, new_id


def _fmt_slope(rise: int, run: int) -> str:
    frac = Fraction(rise, run)
    if frac.denominator == 1:
        return str(frac.numerator)
    return f"{frac.numerator}/{frac.denominator}"


class SlopeTemplate(Template):
    topic = "slope"
    title = "Slope of a Line"

    def generate(self, n: int) -> list[Problem]:
        problems: list[Problem] = []
        for _ in range(n):
            x1 = random.randint(-6, 6)
            y1 = random.randint(-6, 6)
            x2 = random.randint(-6, 6)
            while x2 == x1:  # avoid an undefined (vertical) slope
                x2 = random.randint(-6, 6)
            y2 = random.randint(-6, 6)
            rise = y2 - y1
            run = x2 - x1
            slope = _fmt_slope(rise, run)
            prompt = (
                f"Find the slope of the line through ({x1}, {y1}) and "
                f"({x2}, {y2})."
            )
            steps = [
                r"m = \frac{y_2 - y_1}{x_2 - x_1}",
                rf"= \frac{{{y2} - ({y1})}}{{{x2} - ({x1})}}",
                rf"= \frac{{{rise}}}{{{run}}} = {slope}",
            ]
            problems.append(
                Problem(
                    id=new_id(),
                    prompt=prompt,
                    answer=str(slope),
                    steps=steps,
                    unit=None,
                    diagram=CoordinateDiagram(
                        points=[(float(x1), float(y1)), (float(x2), float(y2))],
                        labels=[f"({x1}, {y1})", f"({x2}, {y2})"],
                    ),
                )
            )
        return problems
