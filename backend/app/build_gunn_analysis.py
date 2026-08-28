"""Build cached Analysis-topic content from real Gunn Maths past papers.

Source: https://www.gunnmaths.org/analysis  (PDFs live in Git LFS in the repo
1datcodes/GunnMaths under src/Courses/Analysis/documents/<N|Unit>/...).

For each Analysis unit this:
  1. downloads a few "Blank" quiz/test PDFs (the student problem sheets),
  2. renders their pages to images,
  3. sends the images to Gemini (vision) asking for ONE worked example plus
     several practice problems + a concept review, in the app's JSON schema,
  4. stores the result in the topic cache (example_answers.json) so it serves
     instantly.

Free-tier safe: a small, fixed number of requests with a delay between calls,
plus a hard request cap. Run one unit at a time, e.g.:

    LLM_API_KEY=... python -m app.build_gunn_analysis "Algebra Through Problem Solving (AtPS)"

Pass no argument to list the available units.
"""
from __future__ import annotations

import base64
import json
import sys
import time
import urllib.parse
from typing import Optional

import httpx

from .config import get_settings
from .example_cache import _load, save_cache, topic_key
from .prompts import LLMPayload, loads_lenient, strip_fences, to_result

# --- Gunn Maths repo layout -------------------------------------------------
_REPO = "1datcodes/GunnMaths"
_BRANCH = "deploy"
# GitHub media host serves the real bytes for Git-LFS-tracked files.
_MEDIA = "https://media.githubusercontent.com/media"
_TREE_API = f"https://api.github.com/repos/{_REPO}/git/trees/{_BRANCH}?recursive=1"
_DOC_PREFIX = "src/Courses/Analysis/documents/"

# Map our topic id -> the unit folder name used in the repo (the "N|Name" dir).
_UNIT_DIR: dict[str, str] = {
    "Algebra Through Problem Solving (AtPS)": "1|AtPS",
    "Probability": "2|Probability",
    "Polar and 3D": "3|Polar_and_3D",
    "Vectors and Parametrics": "4|Vectors_and_Parametrics",
    "Growth": "5|Growth",
    "Matrices": "6|Matrices",
    "A Geometric Approach to Matrices (GAtM)": "7|GAtM",
    "Limits and Calculus": "8|Limits_and_Calculus",
}

# Subsection topics: same source PDFs as the parent unit, but the model focuses
# on a slice of the unit's subject matter so each subsection has distinct
# problems. Keyed by topic id -> (unit dir, focus description).
_SUBSECTIONS: dict[str, tuple[str, str]] = {
    "AtPS: Triangles & Pascal's Triangle": (
        "1|AtPS",
        "the Odd Number Triangle, Pascal's Triangle, triangular numbers, and "
        "the identities relating their entries (Pascal's Identity, Hockey-Stick)",
    ),
    "AtPS: Sequences, Series & Sigma Notation": (
        "1|AtPS",
        "sequences, arithmetic and geometric series, finite differences, and "
        "evaluating sums written in sigma notation (including telescoping and "
        "double sums)",
    ),
    "AtPS: Binomial Theorem & Fibonacci": (
        "1|AtPS",
        "the Binomial Theorem, binomial coefficients (including generalized and "
        "multinomial coefficients), and Fibonacci numbers and their identities",
    ),
    # --- Probability ---
    "Probability: Counting & Combinatorics": (
        "2|Probability",
        "counting techniques: the multiplication principle, permutations, "
        "combinations, and arrangements with restrictions",
    ),
    "Probability: Probability & Expected Value": (
        "2|Probability",
        "computing probabilities of events, conditional probability and "
        "independence, and expected value of random variables",
    ),
    # --- Polar and 3D ---
    "Polar and 3D: Polar Coordinates & Curves": (
        "3|Polar_and_3D",
        "polar coordinates, converting between polar and rectangular form, and "
        "graphing and analyzing polar curves (circles, roses, limacons)",
    ),
    "Polar and 3D: Complex Numbers & 3D Coordinates": (
        "3|Polar_and_3D",
        "complex numbers in polar/trigonometric form, De Moivre's theorem, and "
        "points and distances in three-dimensional coordinate space",
    ),
    # --- Vectors and Parametrics ---
    "Vectors and Parametrics: Vectors & Dot/Cross Products": (
        "4|Vectors_and_Parametrics",
        "vector operations, magnitude and direction, the dot product and angle "
        "between vectors, and the cross product in three dimensions",
    ),
    "Vectors and Parametrics: Parametric & Vector Equations": (
        "4|Vectors_and_Parametrics",
        "parametric equations of curves, and vector/parametric equations of "
        "lines and planes in two and three dimensions",
    ),
    # --- Growth ---
    "Growth: Exponentials & Logarithms": (
        "5|Growth",
        "exponential and logarithmic functions, their properties and laws, and "
        "solving exponential and logarithmic equations",
    ),
    "Growth: Power Functions & Modeling": (
        "5|Growth",
        "power functions, rates of growth and decay, and modeling real-world "
        "growth with exponential and power models",
    ),
    # --- Matrices ---
    "Matrices: Operations & Determinants": (
        "6|Matrices",
        "matrix addition, scalar multiplication, matrix multiplication, and "
        "computing determinants of 2x2 and 3x3 matrices",
    ),
    "Matrices: Systems & Inverses": (
        "6|Matrices",
        "matrix inverses, solving linear systems with matrices, and Gaussian "
        "elimination / row reduction",
    ),
    "Matrices: Eigenvalues & Transformations": (
        "6|Matrices",
        "linear transformations represented by matrices, and finding "
        "eigenvalues and eigenvectors",
    ),
    # --- A Geometric Approach to Matrices (GAtM) ---
    "GAtM: Complex Numbers Geometrically": (
        "7|GAtM",
        "the geometry of complex numbers in the plane: modulus and argument, "
        "the Argand diagram, and complex arithmetic viewed as transformations",
    ),
    "GAtM: Countability & Cardinality": (
        "7|GAtM",
        "set cardinality, countable versus uncountable sets, and arguments "
        "about the sizes of infinite sets",
    ),
    # --- Limits and Calculus ---
    "Limits and Calculus: Sequences & Limits": (
        "8|Limits_and_Calculus",
        "limits of sequences and functions, recursive sequences and their "
        "convergence, and evaluating limits",
    ),
    "Limits and Calculus: Continuity & Derivatives": (
        "8|Limits_and_Calculus",
        "continuity, the definition of the derivative as a limit, and computing "
        "and interpreting derivatives",
    ),
    "Limits and Calculus: Areas & Integrals": (
        "8|Limits_and_Calculus",
        "approximating areas under curves with Riemann sums and the idea of the "
        "definite integral as area",
    ),
}

# --- Free-tier guard rails --------------------------------------------------
_MAX_PAGES = 6          # cap total page-images sent to the model per unit
_MAX_PDFS = 3           # download at most this many Blank PDFs per unit
_DELAY_SECONDS = 6.0    # spacing between model calls (well under free-tier RPM)


def _list_unit_blank_pdfs(unit_dir: str) -> list[str]:
    """Repo paths of the 'Blank' (student) quiz/test PDFs for a unit."""
    resp = httpx.get(_TREE_API, timeout=30.0)
    resp.raise_for_status()
    tree = resp.json().get("tree", [])
    prefix = _DOC_PREFIX + unit_dir + "/"
    paths = [
        t["path"]
        for t in tree
        if t.get("type") == "blob"
        and t["path"].startswith(prefix)
        and t["path"].lower().endswith(".pdf")
        and "blank" in t["path"].lower()
    ]
    # Prefer the most recent years first (names start with a year).
    paths.sort(reverse=True)
    return paths


def _media_url(repo_path: str) -> str:
    quoted = urllib.parse.quote(repo_path)
    return f"{_MEDIA}/{_REPO}/{_BRANCH}/{quoted}"


def _download(repo_path: str) -> bytes:
    resp = httpx.get(_media_url(repo_path), timeout=60.0, follow_redirects=True)
    resp.raise_for_status()
    return resp.content


def _pdf_pages_to_pngs(pdf_bytes: bytes, max_pages: int) -> list[bytes]:
    import pymupdf  # imported lazily so the app doesn't require it at runtime

    out: list[bytes] = []
    doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    for page in doc:
        if len(out) >= max_pages:
            break
        # 120 DPI keeps typeset math readable while shrinking the payload.
        pix = page.get_pixmap(dpi=120)
        out.append(pix.tobytes("png"))
    doc.close()
    return out


def _collect_page_images(unit_dir: str) -> list[bytes]:
    pdfs = _list_unit_blank_pdfs(unit_dir)[:_MAX_PDFS]
    if not pdfs:
        raise SystemExit(f"No Blank PDFs found for unit dir {unit_dir!r}")
    images: list[bytes] = []
    for path in pdfs:
        if len(images) >= _MAX_PAGES:
            break
        print(f"  downloading {path}")
        try:
            pngs = _pdf_pages_to_pngs(_download(path), _MAX_PAGES - len(images))
        except Exception as exc:  # noqa: BLE001 - skip unreadable PDFs
            print(f"    skip ({exc})")
            continue
        images.extend(pngs)
    return images[:_MAX_PAGES]


_BUILD_SYSTEM = (
    "You are a high school Analysis (Honors) teacher. You are given photos of "
    "pages from real past quizzes/tests for one course unit. Using the STYLE, "
    "DIFFICULTY, and TOPICS of these real problems, produce study content. "
    "Respond with STRICT JSON only, no prose, no markdown fences. Schema:\n"
    "{\n"
    '  "concept_review": [str, ...],\n'
    '  "original": {"prompt": str, "answer": str, "steps": [str, ...]},\n'
    '  "practice": [{"prompt": str, "answer": str, "steps": [str, ...]}, ...]\n'
    "}\n"
    "'original' is ONE representative worked example in this unit's style, fully "
    "solved in 'steps'. 'concept_review' is 3-4 bullets of the key "
    "definitions/formulas for this unit. Write ALL mathematics as LaTeX wrapped "
    "in \\( \\) for inline and \\[ \\] for display. Do not invent a problem that "
    "isn't representative of the unit."
)


def _build_query(topic: str, count: int, focus: Optional[str] = None) -> str:
    scope = (
        f"Focus specifically on {focus}. " if focus else ""
    )
    return (
        f"These pages are from the '{topic}' unit of Analysis Honors. {scope}"
        f"Create a concept_review, one worked example in 'original', and {count} "
        "practice problems in 'practice' that match the style and difficulty of "
        "these real problems. Return JSON only."
    )


def _call_gemini_vision(
    topic: str, images: list[bytes], count: int, focus: Optional[str] = None
) -> str:
    settings = get_settings()
    base = (settings.llm_api_base or "https://api.openai.com/v1").rstrip("/")
    headers = {"Content-Type": "application/json"}
    if settings.llm_api_key:
        headers["Authorization"] = f"Bearer {settings.llm_api_key}"
    content: list[dict] = [{"type": "text", "text": _build_query(topic, count, focus)}]
    for png in images:
        uri = "data:image/png;base64," + base64.b64encode(png).decode("ascii")
        content.append({"type": "image_url", "image_url": {"url": uri}})
    body = {
        "model": settings.llm_vision_model,
        "messages": [
            {"role": "system", "content": _BUILD_SYSTEM},
            {"role": "user", "content": content},
        ],
        "temperature": 0.4,
        "response_format": {"type": "json_object"},
        "stream": False,
    }
    # Gemini's free tier occasionally returns 503/429; retry with backoff.
    last_exc: Optional[Exception] = None
    for attempt in range(4):
        try:
            resp = httpx.post(
                f"{base}/chat/completions",
                headers=headers,
                json=body,
                timeout=300.0,
            )
            if resp.status_code in (429, 500, 503):
                wait = 10 * (attempt + 1)
                print(f"    {resp.status_code} from model; retrying in {wait}s")
                time.sleep(wait)
                continue
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]
        except httpx.HTTPError as exc:
            last_exc = exc
            time.sleep(8)
    raise SystemExit(f"model call failed after retries: {last_exc}")


def build_unit(topic: str, count: int = 8) -> dict:
    focus: Optional[str] = None
    if topic in _SUBSECTIONS:
        unit_dir, focus = _SUBSECTIONS[topic]
    else:
        unit_dir = _UNIT_DIR.get(topic)
    if unit_dir is None:
        options = list(_UNIT_DIR) + list(_SUBSECTIONS)
        raise SystemExit(f"Unknown unit {topic!r}. Options: {options}")
    print(f"[gunn] building '{topic}' from unit {unit_dir}")
    images = _collect_page_images(unit_dir)
    print(f"  sending {len(images)} page image(s) to {get_settings().llm_vision_model}")
    time.sleep(_DELAY_SECONDS)  # be polite to the free tier before the call
    raw = _call_gemini_vision(topic, images, count, focus)
    payload = LLMPayload.model_validate(loads_lenient(strip_fences(raw)))
    original, practice, review = to_result(payload, count)
    from .models import SolveResponse

    resp = SolveResponse(
        source="gunn",
        topic="analysis",
        original=original,
        practice=practice,
        concept_review=review,
    )
    return resp.model_dump(mode="json")


def main() -> None:
    args = sys.argv[1:]
    if not args:
        print("Usage: python -m app.build_gunn_analysis <unit or subsection name> [count]")
        print("Available units:")
        for name in _UNIT_DIR:
            print("  -", name)
        print("Available AtPS subsections:")
        for name in _SUBSECTIONS:
            print("  -", name)
        return
    topic = args[0]
    count = int(args[1]) if len(args) > 1 else 8
    result = build_unit(topic, count)
    cache = _load()
    cache[topic_key(topic)] = result
    save_cache(cache)
    print(f"[gunn] cached '{topic}': "
          f"{len(result['original']['steps'])} steps, "
          f"{len(result['practice'])} practice, "
          f"{len(result['concept_review'])} review bullets")
    print(f"[gunn] cache now has {len(cache)} entries")


if __name__ == "__main__":
    main()
