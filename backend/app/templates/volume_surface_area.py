"""Volume and surface area of common solids."""
from __future__ import annotations

import random

from ..models import Problem
from .base import Template, fmt, new_id


class VolumeSurfaceAreaTemplate(Template):
    topic = "volume_surface_area"
    title = "Volume & Surface Area"

    def generate(self, n: int) -> list[Problem]:
        problems: list[Problem] = []
        for _ in range(n):
            solid = random.choice(["prism", "cylinder", "cone", "pyramid", "sphere"])
            problems.append(getattr(self, f"_{solid}")())
        return problems

    def _prism(self) -> Problem:
        l, w, h = (random.randint(3, 12) for _ in range(3))
        vol = l * w * h
        prompt = (
            f"A rectangular prism is {l} cm long, {w} cm wide, and {h} cm tall. "
            "Find its volume."
        )
        steps = [
            r"V = l \cdot w \cdot h",
            rf"= {l} \cdot {w} \cdot {h}",
            rf"= {fmt(vol)}\ \text{{cm}}^3",
        ]
        return self._p(prompt, f"{fmt(vol)} cm^3", steps, "cm^3")

    def _cylinder(self) -> Problem:
        r, h = random.randint(2, 8), random.randint(4, 15)
        vol = round(3.14 * r * r * h, 2)
        prompt = (
            f"A cylinder has radius {r} cm and height {h} cm. Find its volume. "
            "Use \u03c0 \u2248 3.14."
        )
        steps = [
            r"V = \pi r^2 h",
            rf"\approx 3.14 \cdot {r}^2 \cdot {h}",
            rf"\approx {fmt(vol)}\ \text{{cm}}^3",
        ]
        return self._p(prompt, f"{fmt(vol)} cm^3", steps, "cm^3")

    def _cone(self) -> Problem:
        r, h = random.randint(2, 9), random.randint(4, 15)
        vol = round(3.14 * r * r * h / 3, 2)
        prompt = (
            f"A cone has radius {r} cm and height {h} cm. Find its volume. "
            "Use \u03c0 \u2248 3.14."
        )
        steps = [
            r"V = \tfrac{1}{3}\pi r^2 h",
            rf"\approx \tfrac{{1}}{{3}} \cdot 3.14 \cdot {r}^2 \cdot {h}",
            rf"\approx {fmt(vol)}\ \text{{cm}}^3",
        ]
        return self._p(prompt, f"{fmt(vol)} cm^3", steps, "cm^3")

    def _pyramid(self) -> Problem:
        b, h = random.randint(3, 12), random.randint(4, 15)
        vol = round(b * b * h / 3, 2)
        prompt = (
            f"A pyramid has a square base with side {b} cm and a height of {h} cm. "
            "Find its volume."
        )
        steps = [
            r"V = \tfrac{1}{3} B h \quad (B = \text{base area})",
            rf"= \tfrac{{1}}{{3}} \cdot {b}^2 \cdot {h}",
            rf"= {fmt(vol)}\ \text{{cm}}^3",
        ]
        return self._p(prompt, f"{fmt(vol)} cm^3", steps, "cm^3")

    def _sphere(self) -> Problem:
        r = random.randint(2, 9)
        vol = round(4 / 3 * 3.14 * r ** 3, 2)
        prompt = (
            f"A sphere has radius {r} cm. Find its volume. "
            "Use \u03c0 \u2248 3.14."
        )
        steps = [
            r"V = \tfrac{4}{3}\pi r^3",
            rf"\approx \tfrac{{4}}{{3}} \cdot 3.14 \cdot {r}^3",
            rf"\approx {fmt(vol)}\ \text{{cm}}^3",
        ]
        return self._p(prompt, f"{fmt(vol)} cm^3", steps, "cm^3")

    @staticmethod
    def _p(prompt: str, answer: str, steps: list[str], unit: str) -> Problem:
        return Problem(
            id=new_id(), prompt=prompt, answer=answer, steps=steps, unit=unit
        )
