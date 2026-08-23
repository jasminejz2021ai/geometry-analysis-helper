"""Template registry.

Maps classifier topic ids to Template instances and exposes helpers used by
the API layer.
"""
from __future__ import annotations

from typing import Optional

from ..models import Problem
from .angles import AnglesTemplate
from .arc_sector import ArcSectorTemplate
from .area import RectangleAreaTemplate, TriangleAreaTemplate
from .base import Template
from .circle import CircleTemplate
from .circle_theorems import CircleTheoremsTemplate
from .distance_midpoint import DistanceMidpointTemplate
from .parallel_lines import ParallelLinesTemplate
from .polygon_angles import PolygonAnglesTemplate
from .pythagorean import PythagoreanTemplate
from .quadrilateral_area import ParallelogramAreaTemplate, TrapezoidAreaTemplate
from .right_triangle_trig import RightTriangleTrigTemplate
from .similar_triangles import SimilarTrianglesTemplate
from .slope import SlopeTemplate
from .special_right_triangles import SpecialRightTrianglesTemplate
from .volume_surface_area import VolumeSurfaceAreaTemplate

_TEMPLATES: dict[str, Template] = {
    t.topic: t
    for t in (
        PythagoreanTemplate(),
        TriangleAreaTemplate(),
        RectangleAreaTemplate(),
        ParallelogramAreaTemplate(),
        TrapezoidAreaTemplate(),
        CircleTemplate(),
        ArcSectorTemplate(),
        AnglesTemplate(),
        ParallelLinesTemplate(),
        SimilarTrianglesTemplate(),
        DistanceMidpointTemplate(),
        SlopeTemplate(),
        SpecialRightTrianglesTemplate(),
        RightTriangleTrigTemplate(),
        CircleTheoremsTemplate(),
        VolumeSurfaceAreaTemplate(),
        PolygonAnglesTemplate(),
    )
}


def get_template(topic: str) -> Optional[Template]:
    return _TEMPLATES.get(topic)


def template_title(topic: str) -> str:
    t = _TEMPLATES.get(topic)
    return t.title if t else topic


def generate_problems(topic: str, n: int) -> list[Problem]:
    template = _TEMPLATES.get(topic)
    if template is None:
        return []
    return template.generate(n)


def known_topics() -> list[str]:
    return list(_TEMPLATES.keys())


# Short concept reviews shown before the worked example for each template
# topic, mirroring the AI-generated reviews used for conceptual questions.
_CONCEPT_REVIEWS: dict[str, list[str]] = {
    "pythagorean": [
        "In a right triangle, the side opposite the right angle is the hypotenuse.",
        "Pythagorean theorem: \\(a^2 + b^2 = c^2\\), where \\(c\\) is the hypotenuse.",
        "Solve for a missing side by isolating it, e.g. \\(c = \\sqrt{a^2 + b^2}\\).",
    ],
    "special_right_triangles": [
        "A 45-45-90 triangle has legs in ratio \\(1 : 1 : \\sqrt{2}\\).",
        "A 30-60-90 triangle has sides in ratio \\(1 : \\sqrt{3} : 2\\).",
        "Match the given side to its ratio position, then scale the others.",
    ],
    "right_triangle_trig": [
        "SOH-CAH-TOA: \\(\\sin = \\frac{opp}{hyp}\\), \\(\\cos = \\frac{adj}{hyp}\\), \\(\\tan = \\frac{opp}{adj}\\).",
        "Pick the ratio that uses the two quantities you know and want.",
        "Use inverse trig (e.g. \\(\\tan^{-1}\\)) to find an unknown angle.",
    ],
    "circle": [
        "Area of a circle: \\(A = \\pi r^2\\).",
        "Circumference: \\(C = 2\\pi r = \\pi d\\).",
        "The radius is half the diameter: \\(r = d/2\\).",
    ],
    "circle_theorems": [
        "An inscribed angle is half its intercepted arc.",
        "A central angle equals its intercepted arc.",
        "A tangent line is perpendicular to the radius at the point of tangency.",
    ],
    "angles": [
        "Complementary angles sum to \\(90^\\circ\\); supplementary angles sum to \\(180^\\circ\\).",
        "The interior angles of a triangle sum to \\(180^\\circ\\).",
        "Set up an equation from the relationship, then solve for the unknown angle.",
    ],
    "similar_triangles": [
        "Similar triangles have equal angles and proportional corresponding sides.",
        "Set up a proportion of corresponding sides, e.g. \\(\\frac{a}{a'} = \\frac{b}{b'}\\).",
        "Cross-multiply to solve for the missing length.",
    ],
    "distance_midpoint": [
        "Distance: \\(d = \\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}\\).",
        "Midpoint: \\(\\left(\\frac{x_1+x_2}{2}, \\frac{y_1+y_2}{2}\\right)\\).",
        "Substitute the coordinates carefully and simplify.",
    ],
    "polygon_angles": [
        "Interior angle sum of an \\(n\\)-gon: \\((n-2)\\cdot 180^\\circ\\).",
        "Each interior angle of a regular \\(n\\)-gon: \\(\\frac{(n-2)\\cdot 180^\\circ}{n}\\).",
        "Exterior angles of any polygon sum to \\(360^\\circ\\).",
    ],
    "triangle_area": [
        "Area of a triangle: \\(A = \\frac{1}{2} b h\\).",
        "The height is perpendicular to the chosen base.",
        "Perimeter is the sum of all side lengths.",
    ],
    "rectangle_area": [
        "Area of a rectangle: \\(A = l \\cdot w\\).",
        "Perimeter of a rectangle: \\(P = 2(l + w)\\).",
        "Keep length and width in the same units.",
    ],
    "volume_surface_area": [
        "Prism/cylinder volume: base area times height.",
        "Cone and pyramid volume are \\(\\frac{1}{3}\\) of the matching prism/cylinder.",
        "Sphere volume: \\(V = \\frac{4}{3}\\pi r^3\\); surface area \\(= 4\\pi r^2\\).",
    ],
    "parallelogram_area": [
        "Area of a parallelogram: \\(A = b \\cdot h\\), where \\(h\\) is the perpendicular height.",
        "The slanted side is not the height; use the vertical distance between the bases.",
        "Perimeter: \\(P = 2(b + s)\\), summing both pairs of sides.",
    ],
    "trapezoid_area": [
        "A trapezoid has one pair of parallel sides, \\(b_1\\) and \\(b_2\\).",
        "Area of a trapezoid: \\(A = \\tfrac{1}{2}(b_1 + b_2)\\,h\\).",
        "The height \\(h\\) is perpendicular to both parallel sides.",
    ],
    "arc_sector": [
        "A central angle \\(\\theta\\) cuts off a fraction \\(\\frac{\\theta}{360^\\circ}\\) of the circle.",
        "Arc length: \\(\\frac{\\theta}{360^\\circ}\\cdot 2\\pi r\\).",
        "Sector area: \\(\\frac{\\theta}{360^\\circ}\\cdot \\pi r^2\\).",
    ],
    "slope": [
        "Slope measures steepness: \\(m = \\frac{y_2 - y_1}{x_2 - x_1}\\) (rise over run).",
        "Parallel lines have equal slopes; perpendicular lines have slopes that multiply to \\(-1\\).",
        "A horizontal line has slope \\(0\\); a vertical line has an undefined slope.",
    ],
    "parallel_lines": [
        "When a transversal crosses parallel lines, corresponding, alternate interior, and alternate exterior angles are equal.",
        "Co-interior (same-side interior) angles are supplementary (sum to \\(180^\\circ\\)).",
        "Vertical angles are always equal; a linear pair sums to \\(180^\\circ\\).",
    ],
}


def template_concept_review(topic: str) -> list[str]:
    return _CONCEPT_REVIEWS.get(topic, [])


# Honors Geometry units, each mapping to the template topic ids that provide
# instant practice for that unit. Ordered roughly by a typical course sequence.
_HONORS_UNITS: list[tuple[str, list[str]]] = [
    ("Parallel Lines & Angles", ["angles", "parallel_lines"]),
    ("Congruent & Similar Triangles", ["similar_triangles"]),
    ("Polygons", ["polygon_angles"]),
    ("Right Triangles & Trigonometry", [
        "pythagorean",
        "special_right_triangles",
        "right_triangle_trig",
    ]),
    ("Circles", ["circle", "circle_theorems", "arc_sector"]),
    ("Area & Perimeter", [
        "triangle_area",
        "rectangle_area",
        "parallelogram_area",
        "trapezoid_area",
    ]),
    ("Surface Area & Volume", ["volume_surface_area"]),
    ("Coordinate Geometry", ["distance_midpoint", "slope"]),
]


def grouped_topics() -> list[dict]:
    """Return honors units with their available template topics (title + id)."""
    units: list[dict] = []
    for unit_name, topic_ids in _HONORS_UNITS:
        topics = [
            {"id": tid, "title": template_title(tid)}
            for tid in topic_ids
            if tid in _TEMPLATES
        ]
        if topics:
            units.append({"unit": unit_name, "topics": topics})
    return units
