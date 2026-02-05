"""
Core application configuration using Pydantic Settings
"""
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Environment
    ENVIRONMENT: str = Field(default="development")
    DEBUG: bool = Field(default=True)
    
    # API Configuration
    API_HOST: str = Field(default="0.0.0.0")
    API_PORT: int = Field(default=8000)
    API_RELOAD: bool = Field(default=True)
    
    # CORS
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:5173", "http://localhost:3000"]
    )
    
    # Database
    DATABASE_URL: str = Field(default="sqlite+aiosqlite:///./space_agent.db")
    
    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6379/0")
    
    # API Keys
    N2YO_API_KEY: str = Field(default="")
    ANTHROPIC_API_KEY: str = Field(default="")
    
    # External APIs
    NOAA_SWPC_BASE_URL: str = Field(default="https://services.swpc.noaa.gov")
    LAUNCH_LIBRARY_BASE_URL: str = Field(default="https://ll.thespacedevs.com/2.2.0")
    
    # Demo Mode
    DEMO_MODE: bool = Field(default=False)
    
    # Alert Configuration
    ALERT_COOLDOWN_MINUTES: int = Field(default=60)
    MAX_ALERTS_PER_DAY: int = Field(default=50)
    
    # Knowledge Base
    KB_PATH: str = Field(default="./data/knowledge_base")
    VECTOR_STORE_PATH: str = Field(default="./data/vector_store")
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO")
    LOG_FORMAT: str = Field(default="json")
    
    # Security
    SECRET_KEY: str = Field(default="change-this-secret-key-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30)
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = Field(default=100)
    RATE_LIMIT_PERIOD: int = Field(default=60)
    
    # Background Tasks
    ENABLE_SCHEDULER: bool = Field(default=True)
    SPACE_WEATHER_UPDATE_INTERVAL: int = Field(default=300)  # 5 minutes
    TLE_UPDATE_INTERVAL: int = Field(default=86400)  # 24 hours
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


# Global settings instance
settings = Settings()
