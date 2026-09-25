import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

def test_auth_otp_login_flow():
    # 1. Request OTP for om via /api/auth/login/start
    r1 = client.post("/api/auth/login/start", json={"identifier": "om"})
    assert r1.status_code == 200
    data1 = r1.json()
    assert "pending_token" in data1
    pending_token = data1["pending_token"]
    
    # 2. Verify with wrong OTP -> 400
    r_bad = client.post("/api/auth/login/verify-otp", json={"pending_token": pending_token, "otp": "999999"})
    assert r_bad.status_code == 400
    
    # 3. Verify with mock OTP 123456 -> 200 and sets session cookie
    r2 = client.post("/api/auth/login/verify-otp", json={"pending_token": pending_token, "otp": "123456"})
    assert r2.status_code == 200
    assert "session_token" in r2.cookies
    assert r2.json()["username"] == "om"
    
    # 4. Auth me survives with cookie
    r_me = client.get("/api/auth/me", cookies=r2.cookies)
    assert r_me.status_code == 200
    assert r_me.json()["username"] == "om"
    
    # 5. Logout invalidates session
    r_out = client.post("/api/auth/logout", cookies=r2.cookies)
    assert r_out.status_code == 200
    
    # 6. Auth me after logout fails with 401
    r_me_after = client.get("/api/auth/me", cookies={"session_token": r2.cookies["session_token"]})
    assert r_me_after.status_code == 401

def test_register_complete_flow():
    import uuid
    uname = f"user_{uuid.uuid4().hex[:6]}"
    
    # 1. Register start
    r1 = client.post("/api/auth/register/start", json={"identifier": uname})
    assert r1.status_code == 200
    pending_token = r1.json()["pending_token"]
    
    # 2. Register verify OTP
    r2 = client.post("/api/auth/register/verify-otp", json={"pending_token": pending_token, "otp": "123456"})
    assert r2.status_code == 200
    setup_token = r2.json()["setup_token"]
    
    # 3. Complete profile setup
    r3 = client.post("/api/auth/register/complete", json={
        "setup_token": setup_token,
        "display_name": f"Tester {uname}",
        "avatar_color": "#4ade80"
    })
    assert r3.status_code == 200
    assert "session_token" in r3.cookies
    new_user = r3.json()
    assert new_user["username"] == uname
    assert new_user["display_name"] == f"Tester {uname}"
    
    # 4. Verify auth me works with session cookie
    r_me = client.get("/api/auth/me", cookies=r3.cookies)
    assert r_me.status_code == 200
    assert r_me.json()["id"] == new_user["id"]

def test_conversations_and_direct_deduplication():
    # Login Om
    om_auth = client.post("/api/auth/login/password", json={"identifier": "om", "password": "123456"})
    cookies = om_auth.cookies
    
    # List conversations
    res = client.get("/api/conversations", cookies=cookies)
    assert res.status_code == 200
    convs = res.json()
    assert len(convs) >= 4
    
    # Direct deduplication: calling create direct with user 2 (Rahul) returns existing conversation (id=1)
    r_dir = client.post("/api/conversations/direct", json={"user_id": 2}, cookies=cookies)
    assert r_dir.status_code == 200
    assert r_dir.json()["id"] == 1

def test_contact_search_and_add():
    om_auth = client.post("/api/auth/login/password", json={"identifier": "om", "password": "123456"})
    cookies = om_auth.cookies
    
    # Search users
    r_search = client.get("/api/users/search?q=kavya", cookies=cookies)
    assert r_search.status_code == 200
    results = r_search.json()
    assert any(u["username"] == "kavya" for u in results)
    
    # Kavya is already in contacts -> 409
    r_dup = client.post("/api/contacts", json={"username": "kavya"}, cookies=cookies)
    assert r_dup.status_code == 409

def test_messages_replies_and_reactions():
    om_auth = client.post("/api/auth/login/password", json={"identifier": "om", "password": "123456"})
    om_cookies = om_auth.cookies
    
    # Post normal message to conversation 1
    r_msg = client.post("/api/conversations/1/messages", json={"body": "Hello Rahul from test suite"}, cookies=om_cookies)
    assert r_msg.status_code == 200
    msg = r_msg.json()
    msg_id = msg["id"]
    assert msg["sender_status"] == "sent"
    
    # Post reply to that message
    r_reply = client.post(
        "/api/conversations/1/messages",
        json={"body": "Replying to test message", "reply_to_id": msg_id},
        cookies=om_cookies
    )
    assert r_reply.status_code == 200
    reply_msg = r_reply.json()
    assert reply_msg["reply_to_id"] == msg_id
    assert reply_msg["reply_to"]["body"] == "Hello Rahul from test suite"
    
    # Add emoji reaction 👍
    r_react = client.post(
        f"/api/conversations/1/messages/{msg_id}/reactions",
        json={"emoji": "👍"},
        cookies=om_cookies
    )
    assert r_react.status_code == 200
    reactions = r_react.json()
    assert any(r["emoji"] == "👍" and r["user_id"] == 1 for r in reactions)
    
    # Remove reaction
    r_del = client.delete(
        f"/api/conversations/1/messages/{msg_id}/reactions",
        cookies=om_cookies
    )
    assert r_del.status_code == 200
    reactions_after = r_del.json()
    assert not any(r["emoji"] == "👍" and r["user_id"] == 1 for r in reactions_after)

def test_group_admin_authorization():
    # Om is admin in group 4 ("Scaler AI Labs")
    om_auth = client.post("/api/auth/login/password", json={"identifier": "om", "password": "123456"})
    om_cookies = om_auth.cookies
    
    # Priya is regular member in group 4
    priya_auth = client.post("/api/auth/login/password", json={"identifier": "priya", "password": "123456"})
    priya_cookies = priya_auth.cookies
    
    # Priya (non-admin) attempts to remove member 5 (Neha) -> 403 Forbidden
    r_unauth = client.delete("/api/conversations/4/members/5", cookies=priya_cookies)
    assert r_unauth.status_code == 403
    
    # Priya attempts to add member -> 403 Forbidden
    r_unauth_add = client.post("/api/conversations/4/members", json={"user_id": 6}, cookies=priya_cookies)
    assert r_unauth_add.status_code == 403
    
    # Om (admin) can add member 6 (Kavya)
    r_admin_add = client.post("/api/conversations/4/members", json={"user_id": 6}, cookies=om_cookies)
    assert r_admin_add.status_code in (200, 400) # 200 if not yet added, 400 if already added
    
    # Om (admin) can remove member 6
    r_admin_del = client.delete("/api/conversations/4/members/6", cookies=om_cookies)
    assert r_admin_del.status_code == 200

def test_empty_message_validation():
    om_auth = client.post("/api/auth/login/password", json={"identifier": "om", "password": "123456"})
    # Empty message body -> 400
    r = client.post("/api/conversations/1/messages", json={"body": "   "}, cookies=om_auth.cookies)
    assert r.status_code == 400
