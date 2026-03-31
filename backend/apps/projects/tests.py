from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.projects.models import Project


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


class ProjectListFilterTests(TestCase):
    def setUp(self):
        self.client_api = APIClient()
        self.owner = User.objects.create_user(email="owner@test.com", password="Pass12345", role="client")
        Project.objects.create(
            owner=self.owner,
            title="React dashboard",
            description="Need react skills",
            budget=200000,
            timeline_days=10,
            category="web",
            required_skills=["react", "typescript"],
        )
        Project.objects.create(
            owner=self.owner,
            title="Django API",
            description="Need backend",
            budget=150000,
            timeline_days=8,
            category="backend",
            required_skills=["django", "postgresql"],
        )

    def test_list_filters_by_required_skills(self):
        response = self.client_api.get("/api/v1/projects", {"skills": "react"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        rows = response.json()["results"]
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["title"], "React dashboard")
