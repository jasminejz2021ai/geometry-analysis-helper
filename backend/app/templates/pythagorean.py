"""Pythagorean theorem template."""
from __future__ import annotations

import random

import sympy as sp

from ..models import Problem, TriangleDiagram
from .base import Template, fmt, new_id

# Primitive Pythagorean triples; multiples produce clean-integer answers.
_TRIPLES = [(3, 4, 5), (5, 12, 13), (8, 15, 17), (7, 24, 25), (20, 21, 29), (9, 40, 41)]


class PythagoreanTemplate(Template):
    topic = "pythagorean"
    title = "Pythagorean Theorem"

    def generate(self, n: int) -> list[Problem]:
        problems: list[Problem] = []
        for _ in range(n):
            a0, b0, c0 = random.choice(_TRIPLES)
            k = random.randint(1, 4)
            a, b, c = a0 * k, b0 * k, c0 * k

            find_hyp = random.random() < 0.6
            if find_hyp:
                prompt = (
                    f"A right triangle has legs of length {a} cm and {b} cm. "
                    "Find the length of the hypotenuse."
                )
                answer_val = c
                steps = [
                    r"\text{Use } a^2 + b^2 = c^2.",
                    rf"{a}^2 + {b}^2 = c^2",
                    rf"{a * a} + {b * b} = c^2",
                    rf"{a * a + b * b} = c^2",
                    rf"c = \sqrt{{{a * a + b * b}}} = {fmt(c)}\ \text{{cm}}",
                ]
                diagram = TriangleDiagram(
                    a=float(a), b=float(b), c=None, right_angle=True,
                    labels={"a": f"{a} cm", "b": f"{b} cm", "c": "?"},
                )
            else:
                # Solve for a missing leg.
                prompt = (
                    f"A right triangle has a hypotenuse of {c} cm and one leg of {a} cm. "
                    "Find the length of the other leg."
                )
                answer_val = b
                steps = [
                    r"\text{Use } a^2 + b^2 = c^2 \Rightarrow b = \sqrt{c^2 - a^2}.",
                    rf"b = \sqrt{{{c}^2 - {a}^2}}",
                    rf"b = \sqrt{{{c * c} - {a * a}}}",
                    rf"b = \sqrt{{{c * c - a * a}}} = {fmt(b)}\ \text{{cm}}",
                ]
                diagram = TriangleDiagram(
                    a=float(a), b=None, c=float(c), right_angle=True,
                    labels={"a": f"{a} cm", "b": "?", "c": f"{c} cm"},
                )

            problems.append(
                Problem(
                    id=new_id(),
                    prompt=prompt,
                    answer=f"{fmt(answer_val)} cm",
                    steps=steps,
                    unit="cm",
                    diagram=diagram,
                )
            )
        return problems
