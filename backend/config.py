from pydantic_settings import BaseSettings
from pydantic import field_validator
from functools import lru_cache


class Settings(BaseSettings):
    gemini_api_key: str = ""
    frontend_url: str = "http://localhost:3000"

    @field_validator('gemini_api_key', mode='before')
    @classmethod
    def strip_api_key(cls, v: str) -> str:
        return v.strip() if v else ""

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
