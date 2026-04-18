from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "embedding-service"
    app_port: int = 8001
    database_url: str = "postgresql://postgres:password@localhost:5432/wisebot_embedding_database"
    ollama_base_url: str = "http://localhost:11434"
    ollama_embedding_model: str = "nomic-embed-text"
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
    allowed_service_subjects: str = "api-gateway,document-service,chat-service"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
