from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "embedding-service"
    app_port: int = 8001
    database_url: str = "postgresql://postgres:password@localhost:5432/wisebot_embedding_database"
    user_service_base_url: str = "http://localhost:8080"
    system_setting_mode_path: str = "/internal/system-settings/embedding.provider_mode"
    internal_config_api_key: str = "change-me"
    qdrant_url: str = "http://localhost:6333"
    embedding_provider_mode: str = "ollama"
    ollama_provider_name: str = "Ollama Local"
    ollama_base_url: str = "http://localhost:11434"
    ollama_embedding_model: str = "nomic-embed-text"
    third_party_provider_name: str = "OpenAI-Compatible Embeddings API"
    third_party_base_url: str = "https://api.openai.com/v1"
    third_party_api_key: str = ""
    third_party_embedding_model: str = "text-embedding-3-small"
    embedding_dimension: int = 1536
    default_chunk_size: int = 1200
    default_chunk_overlap: int = 200
    default_collection_name: str = "default"
    min_similarity_score: float = 0.35
    search_max_chunk_chars: int = 800
    embed_concurrency: int = 4

    auth_enabled: bool = True
    service_jwt_secret: str = "change-me"
    service_jwt_algorithm: str = "HS256"
    service_jwt_issuer: str = "wisebot"
    service_jwt_audience: str = ""
    allowed_service_subjects: str = "api-gateway,document-service,chat-service,ai-service"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
