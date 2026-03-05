from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.projects.models import Project, Proposal
from apps.reviews.models import Review


class ReviewApiTests(TestCase):
    def setUp(self):
        self.client_api = APIClient()
        self.owner = User.objects.create_user(email="owner@test.com", role="client", password="pass1234")
        self.freelancer = User.objects.create_user(email="freelancer@test.com", role="freelancer", password="pass1234")
        self.outsider = User.objects.create_user(email="outsider@test.com", role="client", password="pass1234")

        self.project = Project.objects.create(
            owner=self.owner,
            title="Review Test Project",
            description="Testing reviews",
            budget=1000000,
            timeline_days=30,
            category="web",
            status=Project.STATUS_COMPLETED,
        )
        proposal = Proposal.objects.create(
            project=self.project,
            freelancer=self.freelancer,
            price=1000000,
            timeline_days=30,
        )
        self.project.selected_proposal = proposal
        self.project.save(update_fields=["selected_proposal"])

    def test_owner_can_review_freelancer(self):
        self.client_api.force_authenticate(self.owner)
        response = self.client_api.post(
            f"/api/v1/projects/{self.project.id}/reviews",
            {"rating": 5, "comment": "Excellent work!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        review = Review.objects.get(project=self.project, reviewer=self.owner)
        self.assertEqual(review.rating, 5)
        self.assertEqual(review.reviewee, self.freelancer)

    def test_freelancer_can_review_owner(self):
        self.client_api.force_authenticate(self.freelancer)
        response = self.client_api.post(
            f"/api/v1/projects/{self.project.id}/reviews",
            {"rating": 4, "comment": "Good client"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        review = Review.objects.get(project=self.project, reviewer=self.freelancer)
        self.assertEqual(review.reviewee, self.owner)

    def test_outsider_cannot_review(self):
        self.client_api.force_authenticate(self.outsider)
        response = self.client_api.post(
            f"/api/v1/projects/{self.project.id}/reviews",
            {"rating": 3, "comment": "spam"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_duplicate_review_blocked(self):
        self.client_api.force_authenticate(self.owner)
        self.client_api.post(
            f"/api/v1/projects/{self.project.id}/reviews",
            {"rating": 5, "comment": "First"},
            format="json",
        )
        response = self.client_api.post(
            f"/api/v1/projects/{self.project.id}/reviews",
            {"rating": 3, "comment": "Duplicate"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_review_on_non_completed_project_blocked(self):
        open_project = Project.objects.create(
            owner=self.owner,
            title="Open Project",
            description="Still open",
            budget=500000,
            timeline_days=14,
            category="web",
            status=Project.STATUS_OPEN,
        )
        self.client_api.force_authenticate(self.owner)
        response = self.client_api.post(
            f"/api/v1/projects/{open_project.id}/reviews",
            {"rating": 5, "comment": "Too early"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rating_outside_1_5_rejected(self):
        self.client_api.force_authenticate(self.owner)

        response = self.client_api.post(
            f"/api/v1/projects/{self.project.id}/reviews",
            {"rating": 0},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        response = self.client_api.post(
            f"/api/v1/projects/{self.project.id}/reviews",
            {"rating": 6},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class RatingSummaryApiTests(TestCase):
    def setUp(self):
        self.client_api = APIClient()
        self.owner = User.objects.create_user(email="owner@test.com", role="client", password="pass1234")
        self.freelancer = User.objects.create_user(email="freelancer@test.com", role="freelancer", password="pass1234")

    def _create_completed_project(self):
        project = Project.objects.create(
            owner=self.owner, title="P", description="d", budget=100000,
            timeline_days=10, category="web", status=Project.STATUS_COMPLETED,
        )
        proposal = Proposal.objects.create(
            project=project, freelancer=self.freelancer, price=100000, timeline_days=10,
        )
        project.selected_proposal = proposal
        project.save(update_fields=["selected_proposal"])
        return project

    def test_rating_summary_returns_average_and_total(self):
        p1 = self._create_completed_project()
        p2 = self._create_completed_project()
        Review.objects.create(project=p1, reviewer=self.owner, reviewee=self.freelancer, rating=5)
        Review.objects.create(project=p2, reviewer=self.owner, reviewee=self.freelancer, rating=3)

        self.client_api.force_authenticate(self.owner)
        response = self.client_api.get(f"/api/v1/users/{self.freelancer.id}/rating-summary")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["total"], 2)
        self.assertEqual(data["average"], 4.0)

    def test_rating_summary_no_reviews(self):
        self.client_api.force_authenticate(self.owner)
        response = self.client_api.get(f"/api/v1/users/{self.freelancer.id}/rating-summary")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["total"], 0)
        self.assertEqual(data["average"], 0)
