from unittest.mock import patch

from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User


def _make_payload(email="user@test.com", email_verified=True, aud="test-client-id"):
    return {
        "aud": aud,
        "email_verified": email_verified,
        "email": email,
        "sub": "google-uid-123",
        "name": "Test User",
    }


@override_settings(GOOGLE_CLIENT_ID="test-client-id")
class GoogleAuthApiTests(TestCase):
    def setUp(self):
        self.client_api = APIClient()

    @patch("google.oauth2.id_token.verify_oauth2_token")
    def test_google_auth_registers_new_user(self, mock_verify):
        mock_verify.return_value = _make_payload(email="new-google-user@test.com")

        response = self.client_api.post(
            "/api/v1/auth/google",
            {"credential": "fake-token", "role": "freelancer"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.json()["authenticated"])
        self.assertEqual(response.json()["user"]["email"], "new-google-user@test.com")
        self.assertEqual(response.json()["user"]["role"], "freelancer")
        self.assertTrue(response.json()["user"]["is_verified"])

        user = User.objects.get(email="new-google-user@test.com")
        self.assertTrue(user.is_verified)
        self.assertEqual(user.role, "freelancer")

    @patch("google.oauth2.id_token.verify_oauth2_token")
    def test_google_auth_logins_existing_user(self, mock_verify):
        User.objects.create(email="existing@test.com", role="client", is_verified=False)
        mock_verify.return_value = _make_payload(email="existing@test.com")

        response = self.client_api.post(
            "/api/v1/auth/google",
            {"credential": "fake-token"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user = User.objects.get(email="existing@test.com")
        self.assertTrue(user.is_verified)
        self.assertEqual(user.role, "client")

    @patch("google.oauth2.id_token.verify_oauth2_token")
    def test_google_auth_repairs_inconsistent_verified_flag(self, mock_verify):
        User.objects.create(
            email="drift@test.com",
            role="client",
            verification_status=User.VERIFICATION_VERIFIED,
            is_verified=False,
        )
        mock_verify.return_value = _make_payload(email="drift@test.com")

        response = self.client_api.post(
            "/api/v1/auth/google",
            {"credential": "fake-token"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user = User.objects.get(email="drift@test.com")
        self.assertEqual(user.verification_status, User.VERIFICATION_VERIFIED)
        self.assertTrue(user.is_verified)

    @patch("google.oauth2.id_token.verify_oauth2_token")
    def test_google_auth_fails_on_invalid_audience(self, mock_verify):
        mock_verify.side_effect = ValueError("Token has wrong audience")

        response = self.client_api.post(
            "/api/v1/auth/google",
            {"credential": "fake-token"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
