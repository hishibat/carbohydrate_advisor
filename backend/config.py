import os
import logging
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from functools import lru_cache

# ロギング設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    gemini_api_key: str = ""
    frontend_url: str = "http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,  # 環境変数名の大文字小文字を区別しない
        extra="ignore",
    )

    @field_validator('gemini_api_key', mode='before')
    @classmethod
    def strip_api_key(cls, v: str) -> str:
        return v.strip() if v else ""


@lru_cache()
def get_settings() -> Settings:
    settings = Settings()

    # デバッグ用: 環境変数の読み込み状況をログ出力
    logger.info("=== 環境変数の読み込み状況 ===")
    logger.info(f"GEMINI_API_KEY (環境変数直接): {os.environ.get('GEMINI_API_KEY', '未設定')[:10]}..." if os.environ.get('GEMINI_API_KEY') else "GEMINI_API_KEY (環境変数直接): 未設定")
    logger.info(f"gemini_api_key (Settings): {'設定済み' if settings.gemini_api_key else '未設定'}")
    logger.info(f"FRONTEND_URL (環境変数直接): {os.environ.get('FRONTEND_URL', '未設定')}")
    logger.info(f"frontend_url (Settings): {settings.frontend_url}")
    logger.info("==============================")

    return settings
