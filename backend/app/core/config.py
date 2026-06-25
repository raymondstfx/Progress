from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Policy in Action Library"
    database_url: str = "postgresql+psycopg://policyai:policyai@localhost:5432/policyai"
    upload_dir: str = "uploads"
    auth_secret: str = "policyai-dev-auth-secret"
    auth_token_ttl_minutes: int = 720
    chroma_host: str = "localhost"
    chroma_port: int = 8001
    chroma_collection: str = "policy_chunks"
    embedding_model: str = "all-MiniLM-L6-v2"
    enable_local_embeddings: bool = False
    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"
    gemini_temperature: float = 0.2
    frontend_origin: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
