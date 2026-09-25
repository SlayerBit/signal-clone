from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health():
    assert client.get("/health").json()["status"] == "ok"


def test_login_and_list_conversations():
    res = client.post("/api/auth/login/password", json={"identifier": "om", "password": "123456"})
    assert res.status_code == 200
    conv = client.get("/api/conversations", cookies=res.cookies)
    assert conv.status_code == 200
    assert len(conv.json()) >= 3


def test_non_admin_cannot_remove_member():
    om = client.post("/api/auth/login/password", json={"identifier": "om", "password": "123456"})
    priya = client.post("/api/auth/login/password", json={"identifier": "priya", "password": "123456"})
    r = client.delete("/api/conversations/4/members/4", cookies=priya.cookies)
    assert r.status_code == 403
