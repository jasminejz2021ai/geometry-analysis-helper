"""Similar triangles template: solve for a missing side using proportions."""
from __future__ import annotations

import random

from ..models import Problem
from .base import Template, fmt, new_id


class SimilarTrianglesTemplate(Template):
    topic = "similar_triangles"
    title = "Similar Triangles"

    def generate(self, n: int) -> list[Problem]:
        problems: list[Problem] = []
        for _ in range(n):
            a = random.randint(3, 12)
            b = random.randint(4, 14)
            k = random.randint(2, 4)
            a2 = a * k
            # x corresponds to b at scale factor k.
            x = b * k
            prompt = (
                f"Two triangles are similar. In the first triangle, two sides measure "
                f"{a} cm and {b} cm. In the second (larger) triangle, the side "
                f"corresponding to the {a} cm side measures {a2} cm. Find the side "
                f"corresponding to the {b} cm side."
            )
            steps = [
                r"\text{Similar triangles have proportional sides:}",
                rf"\frac{{{a2}}}{{{a}}} = \frac{{x}}{{{b}}}",
                rf"x = {b} \cdot \frac{{{a2}}}{{{a}}}",
                rf"x = {b} \cdot {fmt(k)}",
                rf"x = {fmt(x)}\ \text{{cm}}",
            ]
            problems.append(
                Problem(
                    id=new_id(),
                    prompt=prompt,
                    answer=f"{fmt(x)} cm",
                    steps=steps,
                    unit="cm",
                )
            )
        return problems
