"""Area templates for parallelograms and trapezoids."""
from __future__ import annotations

import random

from ..models import Problem
from .base import Template, fmt, new_id


class ParallelogramAreaTemplate(Template):
    topic = "parallelogram_area"
    title = "Parallelogram Area & Perimeter"

    def generate(self, n: int) -> list[Problem]:
        problems: list[Problem] = []
        for _ in range(n):
            base = random.randint(5, 20)
            height = random.randint(3, 15)
            side = random.randint(4, 14)
            want_perimeter = random.random() < 0.4
            if want_perimeter:
                perim = 2 * (base + side)
                prompt = (
                    f"A parallelogram has a base of {base} cm and a slanted side "
                    f"of {side} cm. Find its perimeter."
                )
                steps = [
                    r"\text{Perimeter} = 2(\text{base} + \text{side})",
                    rf"= 2({base} + {side})",
                    rf"= {fmt(perim)}\ \text{{cm}}",
                ]
                answer = f"{fmt(perim)} cm"
                unit = "cm"
            else:
                area = base * height
                prompt = (
                    f"A parallelogram has a base of {base} cm and a height of "
                    f"{height} cm. Find its area."
                )
                steps = [
                    r"\text{Area} = \text{base} \times \text{height}",
                    rf"= {base} \times {height}",
                    rf"= {fmt(area)}\ \text{{cm}}^2",
                ]
                answer = f"{fmt(area)} cm^2"
                unit = "cm^2"
            problems.append(
                Problem(
                    id=new_id(),
                    prompt=prompt,
                    answer=answer,
                    steps=steps,
                    unit=unit,
                )
            )
        return problems


class TrapezoidAreaTemplate(Template):
    topic = "trapezoid_area"
    title = "Area of a Trapezoid"

    def generate(self, n: int) -> list[Problem]:
        problems: list[Problem] = []
        for _ in range(n):
            b1 = random.randint(4, 14)
            b2 = random.randint(b1 + 2, b1 + 12)
            height = random.randint(3, 12)
            area = 0.5 * (b1 + b2) * height
            prompt = (
                f"A trapezoid has parallel sides of {b1} cm and {b2} cm and a "
                f"height of {height} cm. Find its area."
            )
            steps = [
                r"\text{Area} = \tfrac{1}{2}(b_1 + b_2)\,h",
                rf"= \tfrac{{1}}{{2}}({b1} + {b2})\cdot {height}",
                rf"= {fmt(area)}\ \text{{cm}}^2",
            ]
            problems.append(
                Problem(
                    id=new_id(),
                    prompt=prompt,
                    answer=f"{fmt(area)} cm^2",
                    steps=steps,
                    unit="cm^2",
                )
            )
        return problems
