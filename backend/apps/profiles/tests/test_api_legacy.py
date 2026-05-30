from django.core.cache import cache
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.profiles.models import Profile
from apps.projects.models import Project
from apps.reviews.models import Review


class ProfileMeApiTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client_api = APIClient()
        self.user = User.objects.create_user(
            email="freelancer@test.com", role="freelancer", password="pass1234"
        )
        self.client_api.force_authenticate(self.user)

    def test_get_profile_me_creates_profile_if_missing(self):
        # post_save signal now auto-creates, so profile already exists.
        # This test verifies the /me endpoint returns 200 regardless.
        response = self.client_api.get("/api/v1/profiles/me")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(Profile.objects.filter(user=self.user).exists())

    def test_get_profile_me_returns_fields(self):
        profile, _ = Profile.objects.get_or_create(user=self.user)
        profile.full_name = "Bat-Erdene"
        profile.bio = "Full-stack developer"
        profile.skills = ["React", "Python"]
        profile.hourly_rate = 50000
        profile.save()

        response = self.client_api.get("/api/v1/profiles/me")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["full_name"], "Bat-Erdene")
        self.assertEqual(data["bio"], "Full-stack developer")
        self.assertEqual(data["skills"], ["React", "Python"])
        self.assertEqual(data["hourly_rate"], 50000)

    def test_patch_profile_me_updates_fields(self):
        profile, _ = Profile.objects.get_or_create(user=self.user)
        profile.full_name = "Old Name"
        profile.bio = "old bio"
        profile.save()

        response = self.client_api.patch(
            "/api/v1/profiles/me",
            {
                "full_name": "New Name",
                "bio": "New bio",
                "skills": ["Django", "TypeScript"],
                "hourly_rate": 75000,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        profile.refresh_from_db()
        self.assertEqual(profile.full_name, "New Name")
        self.assertEqual(profile.bio, "New bio")
        self.assertEqual(profile.skills, ["Django", "TypeScript"])
        self.assertEqual(profile.hourly_rate, 75000)

    def test_partial_update_only_changes_provided_fields(self):
        profile, _ = Profile.objects.get_or_create(user=self.user)
        profile.full_name = "Original"
        profile.bio = "Original bio"
        profile.hourly_rate = 10000
        profile.save()

        response = self.client_api.patch(
            "/api/v1/profiles/me",
            {"bio": "Updated bio only"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        profile.refresh_from_db()
        self.assertEqual(profile.full_name, "Original")
        self.assertEqual(profile.bio, "Updated bio only")
        self.assertEqual(profile.hourly_rate, 10000)

    def test_unauthenticated_returns_error(self):
        unauthenticated_client = APIClient()
        response = unauthenticated_client.get("/api/v1/profiles/me")
        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )


class ProfileDetailApiTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client_api = APIClient()
        self.user = User.objects.create_user(
            email="public@test.com", role="freelancer", password="pass1234"
        )
        self.viewer = User.objects.create_user(
            email="viewer@test.com", role="client", password="pass1234"
        )
        # Signal auto-creates profile; update it with test data
        profile, _ = Profile.objects.get_or_create(user=self.user)
        profile.full_name = "Public Freelancer"
        profile.bio = "Available for hire"
        profile.skills = ["React", "Node"]
        profile.hourly_rate = 60000
        profile.save()

    def test_get_profile_by_user_id(self):
        self.client_api.force_authenticate(self.viewer)
        response = self.client_api.get(f"/api/v1/profiles/{self.user.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["full_name"], "Public Freelancer")
        self.assertEqual(data["skills"], ["React", "Node"])

    def test_get_nonexistent_profile_returns_404(self):
        self.client_api.force_authenticate(self.viewer)
        response = self.client_api.get("/api/v1/profiles/99999")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class ProfileListFilterApiTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client_api = APIClient()
        self.client_user = User.objects.create_user(
            email="client-filter@test.com", role="client", password="pass1234"
        )
        self.f1 = User.objects.create_user(
            email="f1@test.com", role="freelancer", password="pass1234"
        )
        self.f1.verification_status = User.VERIFICATION_VERIFIED
        self.f1.save(update_fields=["verification_status", "is_verified"])
        self.f2 = User.objects.create_user(
            email="f2@test.com", role="freelancer", password="pass1234"
        )
        self.f3 = User.objects.create_user(
            email="f3@test.com", role="freelancer", password="pass1234"
        )
        self.f3.verification_status = User.VERIFICATION_VERIFIED
        self.f3.save(update_fields=["verification_status", "is_verified"])

        # Signal auto-creates profiles; update them with test data
        p1, _ = Profile.objects.get_or_create(user=self.f1)
        p1.full_name = "React Pro"
        p1.skills = ["react", "nextjs"]
        p1.save()

        p2, _ = Profile.objects.get_or_create(user=self.f2)
        p2.full_name = "Python Dev"
        p2.skills = ["python", "django"]
        p2.save()

        p3, _ = Profile.objects.get_or_create(user=self.f3)
        p3.full_name = "Senior React"
        p3.skills = ["react", "django"]
        p3.save()

        project = Project.objects.create(
            owner=self.client_user,
            title="Landing",
            description="Landing page",
            budget=100000,
            timeline_days=7,
            category="web",
        )
        Review.objects.create(
            project=project,
            reviewer=self.client_user,
            reviewee=self.f1,
            rating=5,
            comment="great",
        )

    def test_filters_skill_and_verified(self):
        response = self.client_api.get(
            "/api/v1/profiles", {"skill": "react", "verified": "true"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = {row["user"] for row in response.json()["results"]}
        self.assertIn(self.f1.id, ids)
        self.assertIn(self.f3.id, ids)
        self.assertNotIn(self.f2.id, ids)

    def test_filters_min_rating(self):
        response = self.client_api.get("/api/v1/profiles", {"min_rating": "4.5"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        rows = response.json()["results"]
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["user"], self.f1.id)
