from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.notifications.models import Notification


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
