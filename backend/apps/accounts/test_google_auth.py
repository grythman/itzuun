from unittest.mock import patch
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import User

@override_settings(GOOGLE_CLIENT_ID="test-client-id")
class GoogleAuthApiTests(TestCase):
    def setUp(self):
        self.client_api = APIClient()

    @patch("apps.accounts.services.requests.get")
    def test_google_auth_registers_new_user(self, mock_get):
        # Mock Google response
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            "aud": "test-client-id",
            "email_verified": "true",
            "email": "new-google-user@test.com",
        }

        response = self.client_api.post(
            "/api/v1/auth/google",
            {
                "credential": "fake-token",
                "role": "freelancer",
            },
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

    @patch("apps.accounts.services.requests.get")
    def test_google_auth_logins_existing_user(self, mock_get):
        User.objects.create(email="existing@test.com", role="client", is_verified=False)
        
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            "aud": "test-client-id",
            "email_verified": True,
            "email": "existing@test.com",
        }

        response = self.client_api.post(
            "/api/v1/auth/google",
            {"credential": "fake-token"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user = User.objects.get(email="existing@test.com")
        self.assertTrue(user.is_verified)
        self.assertEqual(user.role, "client")

    @patch("apps.accounts.services.requests.get")
    def test_google_auth_fails_on_invalid_audience(self, mock_get):
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            "aud": "wrong-client-id",
            "email_verified": "true",
            "email": "user@test.com",
        }

        response = self.client_api.post(
            "/api/v1/auth/google",
            {"credential": "fake-token"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Google credential audience mismatch", response.json()["detail"])
