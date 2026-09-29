from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_ENV = Path(__file__).resolve().parents[3] / ".env"


class Settings(BaseSettings):
    """Cấu hình engine. Đọc từ biến môi trường hoặc file .env ở gốc monorepo."""

    model_config = SettingsConfigDict(env_file=ROOT_ENV, extra="ignore")

    engine_port: int = 8000
    # Trọng số chấm điểm (tổng = 1)
    weight_pickup: float = 0.35
    weight_dropoff: float = 0.25
    weight_time: float = 0.25
    weight_detour: float = 0.15


settings = Settings()
