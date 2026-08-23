"""Topic classifier: map a free-text geometry question to a template id.

Uses ordered keyword/regex rules. Returns the first matching template id or
``None`` when nothing matches (which triggers the LLM fallback).
"""
from __future__ import annotations

import re
from typing import Optional

# Each rule is (template_id, list-of-compiled-patterns). Order matters: more
# specific topics are listed before more generic ones.
_RULES: list[tuple[str, list[re.Pattern[str]]]] = [
    (
        "special_right_triangles",
        [
            re.compile(r"30\s*[-\u2013]?\s*60\s*[-\u2013]?\s*90", re.I),
            re.compile(r"45\s*[-\u2013]?\s*45\s*[-\u2013]?\s*90", re.I),
            re.compile(r"special\s+right\s+triangle", re.I),
        ],
    ),
    (
        "right_triangle_trig",
        [
            re.compile(r"\b(sine|cosine|tangent)\b", re.I),
            re.compile(r"\b(sin|cos|tan)\b", re.I),
            re.compile(r"soh\s*cah\s*toa", re.I),
            re.compile(r"trig(onometry|onometric)?", re.I),
            re.compile(r"\bopposite\b.*\bangle\b.*right", re.I),
        ],
    ),
    (
        "pythagorean",
        [
            re.compile(r"\bpythagor", re.I),
            re.compile(r"\bhypotenuse\b", re.I),
            re.compile(r"right[-\s]?triangle.*(leg|side|hypotenuse)", re.I),
            re.compile(r"\bleg[s]?\b.*right", re.I),
        ],
    ),
    (
        "similar_triangles",
        [
            re.compile(r"similar\s+triangle", re.I),
            re.compile(r"\bproportion(al)?\b.*triangle", re.I),
            re.compile(r"\bscale\s+factor\b", re.I),
        ],
    ),
    (
        "circle_theorems",
        [
            re.compile(r"inscribed\s+angle", re.I),
            re.compile(r"central\s+angle", re.I),
            re.compile(r"intercepted\s+arc", re.I),
            re.compile(r"\barc\b", re.I),
            re.compile(r"\bchord\b", re.I),
            re.compile(r"\btangent\b.*(circle|radius)", re.I),
            re.compile(r"(circle|radius).*\btangent\b", re.I),
        ],
    ),
    (
        "volume_surface_area",
        [
            re.compile(r"\bvolume\b", re.I),
            re.compile(r"surface\s+area", re.I),
            re.compile(r"\b(prism|cylinder|cone|pyramid|sphere)\b", re.I),
        ],
    ),
    (
        "polygon_angles",
        [
            re.compile(r"interior\s+angle", re.I),
            re.compile(r"exterior\s+angle", re.I),
            re.compile(
                r"\b(pentagon|hexagon|heptagon|octagon|nonagon|decagon|dodecagon|polygon)\b",
                re.I,
            ),
        ],
    ),
    (
        "circle",
        [
            re.compile(r"\bcircle\b", re.I),
            re.compile(r"\bcircumference\b", re.I),
            re.compile(r"\bradius\b", re.I),
            re.compile(r"\bdiameter\b", re.I),
        ],
    ),
    (
        "triangle_area",
        [
            re.compile(r"area.*triangle", re.I),
            re.compile(r"triangle.*area", re.I),
            re.compile(r"\bbase\b.*\bheight\b.*triangle", re.I),
        ],
    ),
    (
        "rectangle_area",
        [
            re.compile(r"area.*(rectangle|square)", re.I),
            re.compile(r"(rectangle|square).*area", re.I),
            re.compile(r"perimeter.*(rectangle|square)", re.I),
        ],
    ),
    (
        "angles",
        [
            re.compile(r"complementary", re.I),
            re.compile(r"supplementary", re.I),
            re.compile(r"angle[s]?\s+of\s+a\s+triangle", re.I),
            re.compile(r"triangle.*angle", re.I),
            re.compile(r"\bangle[s]?\b", re.I),
        ],
    ),
    (
        "distance_midpoint",
        [
            re.compile(r"\bmidpoint\b", re.I),
            re.compile(r"distance\s+between", re.I),
            re.compile(r"distance.*points?", re.I),
            re.compile(r"\bcoordinate", re.I),
        ],
    ),
]

# Proof / conceptual questions are handled far better by the LLM/Dify fallback
# than by the numeric templates, so we route them there even if they happen to
# mention a template keyword like "angle" or "triangle".
_CONCEPTUAL = re.compile(
    r"\b(prove|proof|show that|explain|why|derive|define|definition|"
    r"theorem|postulate|justify|reason)\b",
    re.I,
)


def classify(question: str) -> Optional[str]:
    """Return the best-matching template id, or ``None`` if none match."""
    q = question or ""

    # Conceptual/proof questions bypass templates -> fallback provider.
    if _CONCEPTUAL.search(q):
        return None

    for template_id, patterns in _RULES:
        for pat in patterns:
            if pat.search(q):
                return template_id
    return None
