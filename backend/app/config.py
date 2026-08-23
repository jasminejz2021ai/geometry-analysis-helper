"""Application settings loaded from environment / .env."""
from __future__ import annotations

from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Which provider handles questions that no template matches.
    # "dify"      -> call a Dify chatflow app
    # "openai"    -> call OpenAI directly
    # "anthropic" -> call Anthropic directly
    fallback_provider: str = "dify"

    # Direct LLM config (used when fallback_provider is openai/anthropic).
    # When no key is set, that path is disabled UNLESS a custom base URL is set
    # (e.g. a local Ollama server, which needs no API key).
    llm_provider: str = "openai"  # "openai" | "anthropic"
    llm_api_key: Optional[str] = None
    llm_model: str = "gpt-4o-mini"
    # Optional OpenAI-compatible base URL. Point this at a local server such as
    # Ollama ("http://localhost:11434/v1") to run a free local model.
    llm_api_base: Optional[str] = None
    # Vision-capable model for reading photos of problems (via the same
    # OpenAI-compatible endpoint). For Ollama use "qwen2.5vl:7b" — note that
    # llama3.2-vision ("mllama" arch) is NOT supported by current Ollama builds.
    llm_vision_model: str = "qwen2.5vl:7b"

    # Dify config (used when fallback_provider is "dify"). Works with Dify
    # Cloud (https://api.dify.ai) or a self-hosted instance base URL.
    dify_api_base: str = "https://api.dify.ai"
    dify_api_key: Optional[str] = None

    # Comma-separated list of allowed CORS origins for the frontend dev server.
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def dify_enabled(self) -> bool:
        return bool(self.dify_api_key)

    @property
    def direct_llm_enabled(self) -> bool:
        # Enabled with an API key, or with a custom base URL (e.g. local Ollama,
        # which requires no key).
        return bool(self.llm_api_key) or bool(self.llm_api_base)

    @property
    def llm_enabled(self) -> bool:
        """True when the active fallback provider is fully configured."""
        if self.fallback_provider.lower() == "dify":
            return self.dify_enabled
        return self.direct_llm_enabled

    @property
    def vision_available(self) -> bool:
        """True when photo reading is possible via some provider.

        Local vision needs a custom base URL (Ollama) and a vision model;
        otherwise Dify's vision app can be used.
        """
        provider = self.fallback_provider.lower()
        if provider == "dify":
            return self.dify_enabled
        return bool(self.llm_api_base) and bool(self.llm_vision_model)


@lru_cache
def get_settings() -> Settings:
    return Settings()
