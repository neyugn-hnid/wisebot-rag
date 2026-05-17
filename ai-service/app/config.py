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
    embedding_dimension: int = 1536
    default_top_k: int = 5
    default_temperature: float = 0.2
    min_similarity_score: float = 0.35
    max_tokens: int = 1024

    auth_enabled: bool = True
    service_jwt_secret: str = "change-me"
    service_jwt_algorithm: str = "HS256"
    service_jwt_issuer: str = "wisebot"
    service_jwt_audience: str = ""
    allowed_service_subjects: str = "api-gateway,chat-service"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
