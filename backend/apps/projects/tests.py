from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.projects.models import Project, Proposal


class AiDescriptionSuggestTests(TestCase):
    def setUp(self):
        self.client_api = APIClient()
        self.user = User.objects.create_user(
            email="client-ai@test.com", password="Pass12345", role="client"
        )

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
        self.owner = User.objects.create_user(
            email="owner@test.com", password="Pass12345", role="client"
        )
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
            budget=1500000,
            timeline_days=24,
            category="backend",
            required_skills=["django", "postgresql"],
        )
        Project.objects.create(
            owner=self.owner,
            title="Enterprise migration",
            description="Long-running modernization",
            budget=9000000,
            timeline_days=70,
            category="infra",
            required_skills=["kubernetes", "postgresql"],
        )

    def test_list_filters_by_required_skills(self):
        response = self.client_api.get("/api/v1/projects", {"skills": "react"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        rows = response.json()["results"]
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["title"], "React dashboard")

    def test_list_filters_by_budget_range(self):
        response = self.client_api.get(
            "/api/v1/projects", {"budget_min": "1000000", "budget_max": "2000000"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        rows = response.json()["results"]
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["title"], "Django API")

    def test_list_filters_by_experience_proxy(self):
        response_entry = self.client_api.get("/api/v1/projects", {"experience": "entry"})
        self.assertEqual(response_entry.status_code, status.HTTP_200_OK)
        titles_entry = {item["title"] for item in response_entry.json()["results"]}
        self.assertIn("React dashboard", titles_entry)
        self.assertNotIn("Django API", titles_entry)

        response_expert = self.client_api.get("/api/v1/projects", {"experience": "expert"})
        self.assertEqual(response_expert.status_code, status.HTTP_200_OK)
        titles_expert = {item["title"] for item in response_expert.json()["results"]}
        self.assertIn("Enterprise migration", titles_expert)


class ProposalLimitTests(TestCase):
    def setUp(self):
        self.client_api = APIClient()
        self.owner = User.objects.create_user(
            email="proposal-owner@test.com", password="Pass12345", role="client"
        )
        self.freelancer = User.objects.create_user(
            email="proposal-freelancer@test.com",
            password="Pass12345",
            role="freelancer",
        )
        self.freelancer.verification_status = User.VERIFICATION_VERIFIED
        self.freelancer.save(update_fields=["verification_status"])
        self.client_api.force_authenticate(self.freelancer)

    def _create_open_project(self, idx: int) -> Project:
        return Project.objects.create(
            owner=self.owner,
            title=f"Open project {idx}",
            description="desc",
            budget=100000,
            timeline_days=7,
            category="web",
            required_skills=["django"],
        )

    def test_free_tier_blocks_after_ten_proposals(self):
        projects = [self._create_open_project(i) for i in range(1, 12)]
        for project in projects[:10]:
            response = self.client_api.post(
                f"/api/v1/projects/{project.id}/proposals",
                {"price": 100000, "timeline_days": 7, "message": "proposal"},
                format="json",
            )
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        blocked = self.client_api.post(
            f"/api/v1/projects/{projects[10].id}/proposals",
            {"price": 100000, "timeline_days": 7, "message": "proposal"},
            format="json",
        )
        self.assertEqual(blocked.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(blocked.json().get("code"), "proposal_limit_reached")
        self.assertEqual(blocked.json().get("upgrade_url"), "/pro")

    def test_premium_tier_allows_up_to_fifty(self):
        self.freelancer.is_premium = True
        self.freelancer.premium_plan_type = "pro_monthly"
        self.freelancer.save(update_fields=["is_premium", "premium_plan_type"])
        projects = [self._create_open_project(i) for i in range(1, 52)]

        for project in projects[:50]:
            response = self.client_api.post(
                f"/api/v1/projects/{project.id}/proposals",
                {"price": 100000, "timeline_days": 7, "message": "proposal"},
                format="json",
            )
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        blocked = self.client_api.post(
            f"/api/v1/projects/{projects[50].id}/proposals",
            {"price": 100000, "timeline_days": 7, "message": "proposal"},
            format="json",
        )
        self.assertEqual(blocked.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(blocked.json().get("code"), "proposal_limit_reached")

    def test_expired_premium_auto_downgrades_to_free_limit(self):
        self.freelancer.is_premium = True
        self.freelancer.premium_plan_type = "pro_monthly"
        self.freelancer.premium_expiry = timezone.now() - timedelta(days=1)
        self.freelancer.save(
            update_fields=["is_premium", "premium_plan_type", "premium_expiry"]
        )

        projects = [self._create_open_project(i) for i in range(1, 12)]
        for project in projects[:10]:
            response = self.client_api.post(
                f"/api/v1/projects/{project.id}/proposals",
                {"price": 100000, "timeline_days": 7, "message": "proposal"},
                format="json",
            )
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        blocked = self.client_api.post(
            f"/api/v1/projects/{projects[10].id}/proposals",
            {"price": 100000, "timeline_days": 7, "message": "proposal"},
            format="json",
        )
        self.assertEqual(blocked.status_code, status.HTTP_400_BAD_REQUEST)
        self.freelancer.refresh_from_db()
        self.assertFalse(self.freelancer.is_premium)
