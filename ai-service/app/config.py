from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ai-service"
    app_port: int = 8002
    database_url: str = "postgresql://postgres:password@localhost:5432/wisebot_ai_database"
    embedding_base_url: str = "http://localhost:8001"
    embedding_search_path: str = "/v1/search"
    user_service_base_url: str = "http://localhost:8080"
    system_setting_mode_path: str = "/internal/system-settings/ai.provider_mode"
    internal_config_api_key: str = "change-me"
    qdrant_url: str = "http://localhost:6333"
    ai_provider_mode: str = "ollama"
    ai_provider_name: str = "Ollama Local"
    ollama_provider_name: str = "Ollama Local"
    ollama_base_url: str = "http://localhost:11434"
    ollama_llm_model: str = "llama3:latest"
    ollama_embedding_model: str = "nomic-embed-text"
    third_party_provider_name: str = "DeepSeek API"
    third_party_base_url: str = "https://api.openai.com/v1"
    third_party_api_key: str = ""
    third_party_llm_model: str = "gpt-4o-mini"
    third_party_embedding_model: str = "text-embedding-3-small"
    # Must match embedding-service dimension (nomic-embed-text = 768, OpenAI text-embedding-3-small = 1536)
    embedding_dimension: int = 768
    default_top_k: int = 5
    default_temperature: float = 0.2
    min_similarity_score: float = 0.35
    max_tokens: int = 1024

    # ── Query Rewriting ───────────────────────────────────────────────────
    query_rewriting_enabled: bool = True

    # ── Hybrid Search ──────────────────────────────────────────────────────
    hybrid_search_enabled: bool = True
    hybrid_keyword_weight: float = 0.3  # trọng số keyword search trong RRF (0-1)

    # ── Re-ranking ─────────────────────────────────────────────────────────
    reranking_enabled: bool = True
    rerank_top_k_multiplier: int = 3  # lấy top_k * multiplier chunk trước khi rerank

    # ── LLM-as-a-Judge ────────────────────────────────────────────────────
    judge_enabled: bool = True
    judge_use_shared_llm: bool = False  # True = dùng chung llm_manager.client, False = dùng DeepSeek riêng
    judge_llm_base_url: str = "https://api.deepseek.com/v1"
    judge_llm_api_key: str = ""
    judge_llm_model: str = "deepseek-chat"
    judge_timeout_seconds: float = 60.0

    auth_enabled: bool = True
    service_jwt_secret: str = "change-me"
    service_jwt_algorithm: str = "HS256"
    service_jwt_issuer: str = "wisebot"
    service_jwt_audience: str = ""
    allowed_service_subjects: str = "api-gateway,chat-service"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
