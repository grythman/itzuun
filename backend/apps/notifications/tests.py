from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.notifications.models import Notification
from apps.notifications.services import notify_admins_new_brief
from apps.projects.models import Project


class NotificationApiTests(TestCase):
    def setUp(self):
        self.client_api = APIClient()
        self.user = User.objects.create_user(
            email="notification-user@test.com", password="pass1234", role="client"
        )
        self.client_api.force_authenticate(self.user)

    def test_notifications_list_returns_user_notifications(self):
        Notification.objects.create(
            user=self.user,
            type="SMOKE",
            title="Smoke notification",
            description="Smoke notification body",
            metadata={"project_id": 123},
        )

        response = self.client_api.get("/api/v1/notifications/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()
        results = payload.get("results", payload)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["title"], "Smoke notification")


class NotifyAdminsNewBriefTests(TestCase):
    def setUp(self):
        self.admin1 = User.objects.create_user(
            email="admin1@test.com", password="pass1234", role="admin"
        )
        self.admin2 = User.objects.create_user(
            email="admin2@test.com", password="pass1234", role="admin"
        )
        self.client_user = User.objects.create_user(
            email="client@test.com", password="pass1234", role="client"
        )
        self.project = Project.objects.create(
            owner=self.client_user,
            title="Test project",
            description="A test project brief",
            budget=500000,
            timeline_days=14,
            category="web",
        )

    def test_creates_notification_for_each_admin(self):
        count = notify_admins_new_brief(self.project)
        self.assertEqual(count, 2)
        self.assertEqual(Notification.objects.filter(type="NEW_BRIEF").count(), 2)

    def test_notification_content_is_correct(self):
        notify_admins_new_brief(self.project)
        notif = Notification.objects.filter(type="NEW_BRIEF", user=self.admin1).first()
        self.assertIsNotNone(notif)
        self.assertIn("Test project", notif.title)
        self.assertIn("client@test.com", notif.description)
        self.assertEqual(notif.metadata["project_id"], self.project.id)
        self.assertEqual(notif.metadata["budget"], 500000)

    def test_does_not_notify_non_admin_users(self):
        notify_admins_new_brief(self.project)
        client_notifs = Notification.objects.filter(user=self.client_user)
        self.assertEqual(client_notifs.count(), 0)

    def test_returns_zero_when_no_admins(self):
        User.objects.filter(role="admin").update(is_active=False)
        count = notify_admins_new_brief(self.project)
        self.assertEqual(count, 0)
