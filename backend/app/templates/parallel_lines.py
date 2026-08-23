"""Angles formed when a transversal crosses two parallel lines."""
from __future__ import annotations

import random

from ..models import Problem
from .base import Template, new_id

# (relationship name, are the two angles equal?)
_RELATIONS = [
    ("corresponding angles", True),
    ("alternate interior angles", True),
    ("alternate exterior angles", True),
    ("vertical angles", True),
    ("co-interior (same-side interior) angles", False),
    ("a linear pair", False),
]


class ParallelLinesTemplate(Template):
    topic = "parallel_lines"
    title = "Parallel Lines & Transversals"

    def generate(self, n: int) -> list[Problem]:
        problems: list[Problem] = []
        for _ in range(n):
            given = random.randint(35, 145)
            relation, equal = random.choice(_RELATIONS)
            if equal:
                value = given
                steps = [
                    rf"\text{{Given angle}} = {given}^\circ",
                    rf"\text{{{relation.capitalize()} are equal.}}",
                    rf"\text{{So the angle}} = {value}^\circ",
                ]
            else:
                value = 180 - given
                steps = [
                    rf"\text{{Given angle}} = {given}^\circ",
                    rf"\text{{{relation.capitalize()} are supplementary (sum to }}180^\circ).",
                    rf"= 180^\circ - {given}^\circ = {value}^\circ",
                ]
            prompt = (
                f"Two parallel lines are cut by a transversal. One angle measures "
                f"{given}\u00b0. Find the measure of its {relation}."
            )
            problems.append(
                Problem(
                    id=new_id(),
                    prompt=prompt,
                    answer=f"{value} degrees",
                    steps=steps,
                    unit="degrees",
                )
            )
        return problems
