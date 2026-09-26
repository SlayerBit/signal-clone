from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Signal Clone API"
    secret_key: str = "dev-secret-change-in-production"
    database_url: str = "sqlite:///./data/app.db"
    cors_origins: str = "http://localhost:3000,https://signal-clone-pi.vercel.app"
    session_days: int = 14
    mock_otp: str = "123456"
    cookie_name: str = "session_token"
    cookie_secure: bool = False
    seed_on_startup: bool = True
    cookie_samesite: str = "lax"
    cookie_partitioned: bool | None = None

    @model_validator(mode="after")
    def set_default_partitioned(self) -> "Settings":
        if self.cookie_partitioned is None:
            self.cookie_partitioned = bool(self.cookie_secure and str(self.cookie_samesite).lower() == "none")
        return self


settings = Settings()
