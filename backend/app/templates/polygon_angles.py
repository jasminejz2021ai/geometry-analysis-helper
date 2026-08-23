"""Polygon angle sums: interior sum, one interior angle, exterior angle."""
from __future__ import annotations

import random

from ..models import Problem
from .base import Template, fmt, new_id

_NAMES = {
    3: "triangle",
    4: "quadrilateral",
    5: "pentagon",
    6: "hexagon",
    7: "heptagon",
    8: "octagon",
    9: "nonagon",
    10: "decagon",
    12: "dodecagon",
}


class PolygonAnglesTemplate(Template):
    topic = "polygon_angles"
    title = "Polygon Angle Sums"

    def generate(self, n: int) -> list[Problem]:
        problems: list[Problem] = []
        sides_choices = list(_NAMES.keys())
        for _ in range(n):
            sides = random.choice(sides_choices)
            name = _NAMES[sides]
            kind = random.choice(["sum", "interior", "exterior"])
            if kind == "sum":
                total = (sides - 2) * 180
                prompt = (
                    f"Find the sum of the interior angles of a {name} "
                    f"({sides} sides)."
                )
                steps = [
                    r"\text{Sum} = (n - 2) \cdot 180^\circ",
                    rf"= ({sides} - 2) \cdot 180",
                    rf"= {fmt(total)}^\circ",
                ]
                answer = f"{fmt(total)} degrees"
            elif kind == "interior":
                one = (sides - 2) * 180 / sides
                prompt = (
                    f"Find the measure of one interior angle of a regular {name} "
                    f"({sides} sides)."
                )
                steps = [
                    r"\text{Each interior angle} = \frac{(n-2)\cdot 180^\circ}{n}",
                    rf"= \frac{{({sides}-2)\cdot 180}}{{{sides}}}",
                    rf"= {fmt(round(one, 2))}^\circ",
                ]
                answer = f"{fmt(round(one, 2))} degrees"
            else:
                one = 360 / sides
                prompt = (
                    f"Find the measure of one exterior angle of a regular {name} "
                    f"({sides} sides)."
                )
                steps = [
                    r"\text{Each exterior angle} = \frac{360^\circ}{n}",
                    rf"= \frac{{360}}{{{sides}}}",
                    rf"= {fmt(round(one, 2))}^\circ",
                ]
                answer = f"{fmt(round(one, 2))} degrees"

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
