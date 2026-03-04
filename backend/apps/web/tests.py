from django.test import TestCase
from django.urls import reverse
from rest_framework_simplejwt.tokens import AccessToken

from apps.accounts.models import User


class AdminDashboardViewTests(TestCase):
    def test_admin_dashboard_redirects_browser_when_unauthenticated(self):
        response = self.client.get(reverse("admin-dashboard"), secure=True)

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, "/")

    def test_admin_dashboard_returns_401_json_when_unauthenticated_json_request(self):
        response = self.client.get(reverse("admin-dashboard"), HTTP_ACCEPT="application/json", secure=True)

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["detail"], "Authentication credentials were not provided.")

    def test_admin_dashboard_returns_403_json_for_non_admin_json_request(self):
        user = User.objects.create_user(email="client@example.com", role="client")
        token = AccessToken.for_user(user)

        self.client.cookies["access_token"] = str(token)
        response = self.client.get(reverse("admin-dashboard"), HTTP_ACCEPT="application/json", secure=True)

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()["detail"], "You do not have permission to perform this action.")

    def test_admin_dashboard_renders_for_admin_with_token(self):
        user = User.objects.create_user(email="admin@example.com", role="admin")
        token = AccessToken.for_user(user)

        self.client.cookies["access_token"] = str(token)
        response = self.client.get(reverse("admin-dashboard"), secure=True)

        self.assertEqual(response.status_code, 200)
