from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User


class PasswordAuthApiTests(TestCase):
    def setUp(self):
        self.client_api = APIClient()

    def test_register_creates_user_and_authenticates(self):
        response = self.client_api.post(
            "/api/v1/auth/register",
            {
                "email": "new-user@test.com",
                "password": "Pass12345",
                "role": "freelancer",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.json()["authenticated"])
        self.assertEqual(response.json()["user"]["role"], "freelancer")
        self.assertTrue(User.objects.filter(email="new-user@test.com").exists())

    def test_login_authenticates_existing_user(self):
        user = User.objects.create_user(email="login-user@test.com", password="Pass12345", role="client")

        response = self.client_api.post(
            "/api/v1/auth/login",
            {
                "email": user.email,
                "password": "Pass12345",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.json()["authenticated"])
        self.assertEqual(response.json()["user"]["email"], user.email)


class VerificationSubmitApiTests(TestCase):
    def setUp(self):
        self.client_api = APIClient()
        self.user = User.objects.create_user(email="verify-me@test.com", password="Pass12345", role="freelancer")
        self.client_api.force_authenticate(user=self.user)

    def test_submit_verification_sets_pending_and_normalizes_phone(self):
        response = self.client_api.post(
            "/api/v1/users/me/verification",
            {"verification_type": "individual", "phone": "+976 9911-2233"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.verification_status, User.VERIFICATION_PENDING)
        self.assertEqual(self.user.phone, "+97699112233")
        self.assertFalse(self.user.is_verified)

    def test_submit_verification_rejects_invalid_phone(self):
        response = self.client_api.post(
            "/api/v1/users/me/verification",
            {"verification_type": "individual", "phone": "12-ab"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_submit_verification_blocked_when_pending(self):
        self.user.verification_status = User.VERIFICATION_PENDING
        self.user.save(update_fields=["verification_status"])
        response = self.client_api.post(
            "/api/v1/users/me/verification",
            {"verification_type": "individual", "phone": "99112233"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
