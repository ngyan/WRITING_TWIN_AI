from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    APP_ENV: str = "development"
    SECRET_KEY: str = "change-me-in-prod"
    ACCESS_TOKEN_TTL_MIN: int = 15
    REFRESH_TOKEN_TTL_DAYS: int = 30

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://wt:wt@localhost:5432/writing_twin"
    REDIS_URL: str = "redis://localhost:6379/0"
    QDRANT_URL: str = "http://localhost:6333"

    # LLM Providers
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    LITELLM_BASE_URL: str = "http://localhost:4000"

    # Stripe
    STRIPE_API_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PRICE_PRO_MONTHLY: str = ""
    STRIPE_PRICE_PRO_YEARLY: str = ""
    STRIPE_PRICE_TEAM_MONTHLY: str = ""

    # Observability
    SENTRY_DSN: str = ""
    LANGFUSE_PUBLIC_KEY: str = ""
    LANGFUSE_SECRET_KEY: str = ""
    LANGFUSE_HOST: str = "https://cloud.langfuse.com"

    # LLM timeouts + circuit breaker
    LLM_TIMEOUT_SECONDS: int = 20
    CIRCUIT_BREAK_THRESHOLD: int = 3    # consecutive failures before opening circuit
    CIRCUIT_RESET_SECONDS: int = 60     # seconds before half-open retry

    # Cost guard
    COST_GUARD_DAILY_LIMIT_USD: float = 10.0   # 0 = disabled

    # Billing
    FREE_MONTHLY_LIMIT: int = 20
    PRO_MONTHLY_LIMIT: int = 300

    # Feature Flags
    FEATURE_BILLING: bool = True
    FEATURE_WRITING_DNA: bool = False
    FEATURE_CONTEXT_ENGINE: bool = True
    FEATURE_CULTURAL_ENGINE: bool = False
    FEATURE_QUALITY_RETRY: bool = False
    FEATURE_EXTENSION_BETA: bool = False
    FEATURE_COMMUNICATION_MEMORY: bool = False


settings = Settings()
