"""Unit tests for security.py — JWT and bcrypt."""

import pytest
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)


class TestPasswordHashing:
    def test_hash_is_not_plaintext(self):
        hashed = hash_password("mysecret")
        assert hashed != "mysecret"

    def test_verify_correct_password(self):
        hashed = hash_password("correct_password")
        assert verify_password("correct_password", hashed) is True

    def test_verify_wrong_password(self):
        hashed = hash_password("correct_password")
        assert verify_password("wrong_password", hashed) is False

    def test_two_hashes_of_same_password_differ(self):
        # bcrypt salts hashes, so two hashes of the same input should differ
        h1 = hash_password("same_password")
        h2 = hash_password("same_password")
        assert h1 != h2

    def test_empty_password_can_be_hashed(self):
        hashed = hash_password("")
        assert verify_password("", hashed) is True


class TestJWT:
    def test_token_encodes_and_decodes(self):
        token = create_access_token(user_id=42, role="CUSTOMER")
        payload = decode_access_token(token)
        assert payload is not None
        assert payload["sub"] == "42"
        assert payload["role"] == "CUSTOMER"

    def test_admin_role_preserved(self):
        token = create_access_token(user_id=1, role="ADMIN")
        payload = decode_access_token(token)
        assert payload["role"] == "ADMIN"

    def test_invalid_token_returns_none(self):
        result = decode_access_token("not.a.valid.token")
        assert result is None

    def test_tampered_token_returns_none(self):
        token = create_access_token(user_id=1, role="CUSTOMER")
        tampered = token[:-5] + "XXXXX"
        result = decode_access_token(tampered)
        assert result is None

    def test_empty_string_returns_none(self):
        result = decode_access_token("")
        assert result is None
