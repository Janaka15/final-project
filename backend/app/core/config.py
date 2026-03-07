from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List
import json


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://somerset:somerset_pass@localhost:5432/somerset_hotel"
    SECRET_KEY: str = "change-this-to-a-random-secret-key-at-least-32-chars"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 10080  # 7 days

    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    DIALOGFLOW_PROJECT_ID: str = ""
    GOOGLE_APPLICATION_CREDENTIALS_JSON: str = ""

    ADMIN_EMAIL: str = "admin@somersetmirissa.com"
    ADMIN_PASSWORD: str = "Admin@2024!"
    ADMIN_NAME: str = "Hotel Admin"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
