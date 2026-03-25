from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User


class AiDescriptionSuggestTests(TestCase):
    def setUp(self):
        self.client_api = APIClient()
        self.user = User.objects.create_user(email="client-ai@test.com", password="Pass12345", role="client")

    def test_suggest_requires_authentication(self):
        response = self.client_api.post(
            "/api/v1/projects/ai-description-suggest",
            {
                "title": "Build marketplace",
                "category": "web",
                "budget": 1000000,
                "timeline_days": 14,
                "required_skills": ["react", "django"],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_suggest_returns_description(self):
        self.client_api.force_authenticate(self.user)
        response = self.client_api.post(
            "/api/v1/projects/ai-description-suggest",
            {
                "title": "Build marketplace",
                "category": "web",
                "budget": 1000000,
                "timeline_days": 14,
                "required_skills": ["react", "django"],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("description", response.json())
        self.assertIn("Build marketplace", response.json()["description"])
