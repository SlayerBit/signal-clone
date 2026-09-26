import pytest
from fastapi.testclient import TestClient
from app.core.config import Settings
import app.api.routes as routes_module
from main import app


def test_dev_cookie_attributes(monkeypatch):
    """Local development cookies should be SameSite=Lax without Secure or Partitioned."""
    monkeypatch.setattr(routes_module.settings, "cookie_secure", False)
    monkeypatch.setattr(routes_module.settings, "cookie_samesite", "lax")
    monkeypatch.setattr(routes_module.settings, "cookie_partitioned", False)

    client = TestClient(app)
    res = client.post("/api/auth/login/password", json={"identifier": "om", "password": "123456"})
    assert res.status_code == 200

    set_cookie = res.headers.get("set-cookie", "")
    assert "session_token=" in set_cookie
    assert "HttpOnly" in set_cookie or "httponly" in set_cookie.lower()
    assert "SameSite=lax" in set_cookie or "samesite=lax" in set_cookie.lower()
    assert "Secure" not in set_cookie and "secure" not in set_cookie.lower()
    assert "Partitioned" not in set_cookie and "partitioned" not in set_cookie.lower()

    # Logout
    res_logout = client.post("/api/auth/logout", cookies=res.cookies)
    assert res_logout.status_code == 200
    logout_cookie = res_logout.headers.get("set-cookie", "")
    assert "Max-Age=0" in logout_cookie
    assert "Partitioned" not in logout_cookie


def test_production_partitioned_cookie_attributes(monkeypatch):
    """Production cross-site cookies must have HttpOnly, Secure, SameSite=None, and Partitioned."""
    monkeypatch.setattr(routes_module.settings, "cookie_secure", True)
    monkeypatch.setattr(routes_module.settings, "cookie_samesite", "none")
    monkeypatch.setattr(routes_module.settings, "cookie_partitioned", True)

    client = TestClient(app, base_url="https://testserver")
    res = client.post("/api/auth/login/password", json={"identifier": "om", "password": "123456"})
    assert res.status_code == 200

    set_cookie = res.headers.get("set-cookie", "")
    assert "session_token=" in set_cookie
    assert "HttpOnly" in set_cookie
    assert "Secure" in set_cookie
    assert "SameSite=none" in set_cookie or "samesite=none" in set_cookie.lower()
    assert "Partitioned" in set_cookie

    # Logout in production should also clear the partitioned cookie with matching attributes
    res_logout = client.post("/api/auth/logout", cookies=res.cookies)
    assert res_logout.status_code == 200
    logout_cookie = res_logout.headers.get("set-cookie", "")
    assert "Max-Age=0" in logout_cookie
    assert "Secure" in logout_cookie
    assert "samesite=none" in logout_cookie.lower()
    assert "Partitioned" in logout_cookie


def test_settings_automatic_partitioned_derivation():
    """Verify Settings auto-enables cookie_partitioned when Secure=True and SameSite=none."""
    dev_settings = Settings(cookie_secure=False, cookie_samesite="lax")
    assert dev_settings.cookie_partitioned is False

    prod_settings = Settings(cookie_secure=True, cookie_samesite="none")
    assert prod_settings.cookie_partitioned is True

    explicit_off = Settings(cookie_secure=True, cookie_samesite="none", cookie_partitioned=False)
    assert explicit_off.cookie_partitioned is False


def test_cors_credentials_and_origin():
    """Verify CORS headers for production Vercel frontend."""
    client = TestClient(app)
    # Preflight request
    res = client.options(
        "/api/auth/me",
        headers={
            "Origin": "https://signal-clone-pi.vercel.app",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "https://signal-clone-pi.vercel.app"
    assert res.headers.get("access-control-allow-credentials") == "true"
