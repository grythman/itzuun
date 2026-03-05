from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.messaging.models import ProjectMessage
from apps.projects.models import Project, Proposal


class ProjectMessageApiTests(TestCase):
    def setUp(self):
        self.client_api = APIClient()
        self.owner = User.objects.create_user(email="owner@test.com", role="client", password="pass1234")
        self.freelancer = User.objects.create_user(email="freelancer@test.com", role="freelancer", password="pass1234")
        self.outsider = User.objects.create_user(email="outsider@test.com", role="freelancer", password="pass1234")

        self.project = Project.objects.create(
            owner=self.owner,
            title="Chat Test Project",
            description="Test project for messaging",
            budget=500000,
            timeline_days=14,
            category="web",
            status=Project.STATUS_IN_PROGRESS,
        )
        proposal = Proposal.objects.create(
            project=self.project,
            freelancer=self.freelancer,
            price=500000,
            timeline_days=14,
        )
        self.project.selected_proposal = proposal
        self.project.save(update_fields=["selected_proposal"])

    def test_owner_can_send_message(self):
        self.client_api.force_authenticate(self.owner)
        response = self.client_api.post(
            f"/api/v1/projects/{self.project.id}/messages",
            {"text": "Hello freelancer!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()["text"], "Hello freelancer!")
        self.assertEqual(response.json()["sender"], self.owner.id)

    def test_freelancer_can_send_message(self):
        self.client_api.force_authenticate(self.freelancer)
        response = self.client_api.post(
            f"/api/v1/projects/{self.project.id}/messages",
            {"text": "Hello owner!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()["sender"], self.freelancer.id)

    def test_outsider_cannot_send_message(self):
        self.client_api.force_authenticate(self.outsider)
        response = self.client_api.post(
            f"/api/v1/projects/{self.project.id}/messages",
            {"text": "I should not be able to send this"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_can_list_messages(self):
        ProjectMessage.objects.create(project=self.project, sender=self.owner, text="msg 1")
        ProjectMessage.objects.create(project=self.project, sender=self.freelancer, text="msg 2")

        self.client_api.force_authenticate(self.owner)
        response = self.client_api.get(f"/api/v1/projects/{self.project.id}/messages")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        results = data["results"] if isinstance(data, dict) and "results" in data else data
        self.assertEqual(len(results), 2)

    def test_outsider_cannot_list_messages(self):
        ProjectMessage.objects.create(project=self.project, sender=self.owner, text="secret")

        self.client_api.force_authenticate(self.outsider)
        response = self.client_api.get(f"/api/v1/projects/{self.project.id}/messages")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_messages_for_nonexistent_project_returns_404(self):
        self.client_api.force_authenticate(self.owner)
        response = self.client_api.get("/api/v1/projects/99999/messages")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_message_ordering_by_created(self):
        msg1 = ProjectMessage.objects.create(project=self.project, sender=self.owner, text="first")
        msg2 = ProjectMessage.objects.create(project=self.project, sender=self.freelancer, text="second")

        self.client_api.force_authenticate(self.owner)
        response = self.client_api.get(f"/api/v1/projects/{self.project.id}/messages")
        data = response.json()
        results = data["results"] if isinstance(data, dict) and "results" in data else data

        # Backend orders by -created_at (newest first)
        self.assertEqual(results[0]["text"], "second")
        self.assertEqual(results[1]["text"], "first")
