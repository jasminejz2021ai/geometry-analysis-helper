"""Area templates: triangle area, rectangle/square area & perimeter."""
from __future__ import annotations

import random

from ..models import Problem, RectangleDiagram, TriangleDiagram
from .base import Template, fmt, new_id


class TriangleAreaTemplate(Template):
    topic = "triangle_area"
    title = "Area of a Triangle"

    def generate(self, n: int) -> list[Problem]:
        problems: list[Problem] = []
        for _ in range(n):
            base = random.randint(4, 20)
            height = random.randint(3, 18)
            area = 0.5 * base * height
            prompt = (
                f"A triangle has a base of {base} cm and a height of {height} cm. "
                "Find its area."
            )
            steps = [
                r"\text{Area} = \tfrac{1}{2} \cdot b \cdot h",
                rf"= \tfrac{{1}}{{2}} \cdot {base} \cdot {height}",
                rf"= {fmt(area)}\ \text{{cm}}^2",
            ]
            problems.append(
                Problem(
                    id=new_id(),
                    prompt=prompt,
                    answer=f"{fmt(area)} cm^2",
                    steps=steps,
                    unit="cm^2",
                    diagram=TriangleDiagram(
                        a=float(base), b=float(height), right_angle=True,
                        labels={"a": f"b = {base} cm", "b": f"h = {height} cm", "c": ""},
                    ),
                )
            )
        return problems


class RectangleAreaTemplate(Template):
    topic = "rectangle_area"
    title = "Rectangle Area & Perimeter"

    def generate(self, n: int) -> list[Problem]:
        problems: list[Problem] = []
        for _ in range(n):
            width = random.randint(3, 20)
            height = random.randint(3, 20)
            want_perimeter = random.random() < 0.4
            if want_perimeter:
                perim = 2 * (width + height)
                prompt = (
                    f"A rectangle is {width} cm wide and {height} cm tall. "
                    "Find its perimeter."
                )
                steps = [
                    r"\text{Perimeter} = 2(w + h)",
                    rf"= 2({width} + {height})",
                    rf"= {fmt(perim)}\ \text{{cm}}",
                ]
                answer = f"{fmt(perim)} cm"
                unit = "cm"
            else:
                area = width * height
                prompt = (
                    f"A rectangle is {width} cm wide and {height} cm tall. "
                    "Find its area."
                )
                steps = [
                    r"\text{Area} = w \cdot h",
                    rf"= {width} \cdot {height}",
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
                    diagram=RectangleDiagram(
                        width=float(width), height=float(height),
                        labels={"width": f"{width} cm", "height": f"{height} cm"},
                    ),
                )
            )
        return problems
