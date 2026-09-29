"""Per-request AI state: an optional student-supplied API key, plus the HTTP
status of the last failed AI call so endpoints can explain *why* it failed
(quota used up vs. key rejected) instead of a generic error.

The state lives in a ContextVar holding a mutable object, so worker threads
started with ``copy_context()`` share the same object and their recorded
errors are visible to the request handler.
"""
from __future__ import annotations

from contextvars import ContextVar, Token
from dataclasses import dataclass
from typing import Optional

import httpx

# Browsers send the student's own key in this header.
USER_KEY_HEADER = "X-Gemini-Api-Key"


@dataclass
class _State:
    user_api_key: Optional[str] = None
    error_status: Optional[int] = None


_state: ContextVar[Optional[_State]] = ContextVar("ai_request_state", default=None)


def begin(user_api_key: Optional[str]) -> Token:
    return _state.set(_State(user_api_key=user_api_key))


def end(token: Token) -> None:
    _state.reset(token)


def user_api_key() -> Optional[str]:
    s = _state.get()
    return s.user_api_key if s else None


def record_status(status: int) -> None:
    s = _state.get()
    if s is not None:
        s.error_status = status


def record_error(exc: BaseException) -> None:
    if isinstance(exc, httpx.HTTPStatusError):
        record_status(exc.response.status_code)


def last_error_status() -> Optional[int]:
    s = _state.get()
    return s.error_status if s else None
