"""Site visit counter backed by the Abacus counting service."""
from __future__ import annotations

import logging
from typing import Optional

import httpx

from .config import get_settings

logger = logging.getLogger(__name__)


def _call(action: str) -> Optional[int]:
    s = get_settings()
    url = (
        f"{s.visit_counter_api.rstrip('/')}/{action}/"
        f"{s.visit_counter_namespace}/{s.visit_counter_key}"
    )
    try:
        resp = httpx.get(url, timeout=8.0)
        if action == "get" and resp.status_code == 404:
            return 0  # the key is created on the first hit
        resp.raise_for_status()
        return int(resp.json()["value"])
    except (httpx.HTTPError, KeyError, ValueError) as exc:
        logger.warning("Visit counter %s failed: %s", action, exc)
        return None


def record_visit() -> Optional[int]:
    """Count one visit and return the new displayed total (None on failure)."""
    count = _call("hit")
    return None if count is None else get_settings().visit_count_base + count


def current_visits() -> Optional[int]:
    count = _call("get")
    return None if count is None else get_settings().visit_count_base + count
