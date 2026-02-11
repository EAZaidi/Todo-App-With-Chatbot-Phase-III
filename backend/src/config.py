"""
Environment configuration for Backend Todo API.

Loads configuration from environment variables using python-dotenv.
"""

from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Get the backend directory path (parent of src/)
BACKEND_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BACKEND_DIR / ".env"

# Load .env into os.environ so third-party SDKs (e.g. OpenAI) can find their keys
load_dotenv(ENV_FILE)


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.

    Required settings:
    - DATABASE_URL: PostgreSQL connection string (format: postgresql+asyncpg://...)

    Optional settings:
    - ENVIRONMENT: Application environment (default: development)
    - HOST: Server host (default: 0.0.0.0)
    - PORT: Server port (default: 8000)
    """

    # Database Configuration (Required)
    DATABASE_URL: str

    # Application Configuration
    ENVIRONMENT: str = "development"

    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Authentication Configuration
    JWKS_URL: str = "http://localhost:3001/api/auth/jwks"

    # CORS / Frontend URL (set to deployed frontend URL in production)
    FRONTEND_URL: str = "http://localhost:3001"

    # Phase III: AI Chatbot Configuration
    OPENAI_API_KEY: str = ""
    MCP_SERVER_URL: str = "http://localhost:9000/mcp"

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.ENVIRONMENT.lower() == "development"

    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.ENVIRONMENT.lower() == "production"


# Global settings instance
settings = Settings()
