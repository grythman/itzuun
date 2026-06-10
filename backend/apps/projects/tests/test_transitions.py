"""Tests for project status transition flow."""

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.notifications.models import Notification
from apps.projects.models import Project, Proposal
from apps.projects.services import select_freelancer, transition_project_status
from common.exceptions import DomainError


class AdminProjectTransitionViewTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            email="admin@example.com", password="pass"
        )
        self.client_user = User.objects.create_user(
            email="client@example.com", password="pass", role=User.ROLE_CLIENT
        )
        self.project = Project.objects.create(
            owner=self.client_user,
            title="Test Project",
            description="Test description",
            budget=100000,
            timeline_days=14,
            category="web",
            status=Project.STATUS_OPEN,
        )
        self.api_client = APIClient()
        self.api_client.force_authenticate(user=self.admin)

    def _transition_url(self, project_id):
        return reverse("admin-project-transition", kwargs={"project_id": project_id})

    def test_valid_transition_open_to_reviewing(self):
        url = self._transition_url(self.project.id)
        resp = self.api_client.post(url, {"action": "reviewing"}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.project.refresh_from_db()
        self.assertEqual(self.project.status, "reviewing")

    def test_valid_transition_reviewing_to_agreed(self):
        self.project.status = "reviewing"
        self.project.save()
        url = self._transition_url(self.project.id)
        resp = self.api_client.post(url, {"action": "agreed"}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.project.refresh_from_db()
        self.assertEqual(self.project.status, "agreed")

    def test_valid_transition_agreed_to_paid(self):
        self.project.status = "agreed"
        self.project.save()
        url = self._transition_url(self.project.id)
        resp = self.api_client.post(url, {"action": "paid"}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.project.refresh_from_db()
        self.assertEqual(self.project.status, "paid")

    def test_full_admin_flow(self):
        """Test the full admin transition flow: open -> reviewing -> agreed -> paid."""
        url = self._transition_url(self.project.id)

        resp = self.api_client.post(url, {"action": "reviewing"}, format="json")
        self.assertEqual(resp.status_code, 200)

        resp = self.api_client.post(url, {"action": "agreed"}, format="json")
        self.assertEqual(resp.status_code, 200)

        resp = self.api_client.post(url, {"action": "paid"}, format="json")
        self.assertEqual(resp.status_code, 200)

        self.project.refresh_from_db()
        self.assertEqual(self.project.status, "paid")

    def test_invalid_transition_returns_400(self):
        """open -> paid is not allowed."""
        url = self._transition_url(self.project.id)
        resp = self.api_client.post(url, {"action": "paid"}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_invalid_action_returns_400(self):
        url = self._transition_url(self.project.id)
        resp = self.api_client.post(url, {"action": "bogus"}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_non_admin_gets_403(self):
        non_admin_client = APIClient()
        non_admin_client.force_authenticate(user=self.client_user)
        url = self._transition_url(self.project.id)
        resp = non_admin_client.post(url, {"action": "reviewing"}, format="json")
        self.assertEqual(resp.status_code, 403)

    def test_notifications_created_on_transition(self):
        url = self._transition_url(self.project.id)
        with self.captureOnCommitCallbacks(execute=True):
            self.api_client.post(url, {"action": "reviewing"}, format="json")

        notifications = Notification.objects.filter(
            user=self.client_user, type="STATUS_CHANGE"
        )
        self.assertTrue(notifications.exists())
        notif = notifications.first()
        self.assertIn("reviewing", notif.title)

    def test_nonexistent_project_returns_404(self):
        url = self._transition_url(99999)
        resp = self.api_client.post(url, {"action": "reviewing"}, format="json")
        self.assertEqual(resp.status_code, 404)


class SelectFreelancerTransitionTests(TestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(
            email="client@example.com", password="pass", role=User.ROLE_CLIENT
        )
        self.freelancer = User.objects.create_user(
            email="freelancer@example.com", password="pass", role=User.ROLE_FREELANCER
        )
        self.project = Project.objects.create(
            owner=self.client_user,
            title="Test Project",
            description="Test description",
            budget=100000,
            timeline_days=14,
            category="web",
            status=Project.STATUS_PAID,
        )
        self.proposal = Proposal.objects.create(
            project=self.project,
            freelancer=self.freelancer,
            price=90000,
            timeline_days=10,
            message="I can do this",
        )

    def test_select_freelancer_from_paid_status(self):
        project = select_freelancer(self.project, self.proposal)
        self.assertEqual(project.status, Project.STATUS_IN_PROGRESS)
        self.assertEqual(project.selected_proposal, self.proposal)
        self.proposal.refresh_from_db()
        self.assertEqual(self.proposal.status, Proposal.STATUS_ACCEPTED)

    def test_select_freelancer_from_open_status_fails(self):
        self.project.status = Project.STATUS_OPEN
        self.project.save()
        with self.assertRaises(DomainError):
            select_freelancer(self.project, self.proposal)

    def test_select_freelancer_from_reviewing_status_fails(self):
        self.project.status = "reviewing"
        self.project.save()
        with self.assertRaises(DomainError):
            select_freelancer(self.project, self.proposal)


class TransitionProjectStatusServiceTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            email="admin@example.com", password="pass"
        )
        self.client_user = User.objects.create_user(
            email="client@example.com", password="pass", role=User.ROLE_CLIENT
        )
        self.project = Project.objects.create(
            owner=self.client_user,
            title="Test Project",
            description="Test description",
            budget=100000,
            timeline_days=14,
            category="web",
            status=Project.STATUS_OPEN,
        )

    def test_valid_transition(self):
        project = transition_project_status(self.project, "reviewing", self.admin)
        self.assertEqual(project.status, "reviewing")

    def test_invalid_transition_raises_domain_error(self):
        with self.assertRaises(DomainError):
            transition_project_status(self.project, "completed", self.admin)

    def test_transition_creates_notification_for_owner(self):
        with self.captureOnCommitCallbacks(execute=True):
            transition_project_status(self.project, "reviewing", self.admin)
        notifications = Notification.objects.filter(
            user=self.client_user, type="STATUS_CHANGE"
        )
        self.assertEqual(notifications.count(), 1)
