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
