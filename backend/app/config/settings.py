from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "EV Charge - Availability & Demand Prediction Platform"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "ev-charge-super-secret-key-change-in-production-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # MongoDB Settings
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "ev_charging_db")

    # ML Model directory
    MODEL_DIR: str = os.getenv("MODEL_DIR", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../saved_models")))
    DATASET_PATH: str = os.getenv("DATASET_PATH", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../dataset/EV_Charging_Station_Dataset.csv")))

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
