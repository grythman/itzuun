from django.test import TestCase
from rest_framework.test import APIClient
from django.urls import reverse

from apps.accounts.models import User


class AdminUserVerifyTests(TestCase):
    def setUp(self):
        # create admin user
        self.admin = User.objects.create_superuser(email="admin@example.com", password="pass")
        # target user
        self.user = User.objects.create_user(email="target@example.com", password="pass", role=User.ROLE_CLIENT)
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    def test_verify_user_success(self):
        url = reverse("admin-users-verify", kwargs={"user_id": self.user.id})
        resp = self.client.post(url, {"action": "verify"}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.verification_status, User.VERIFICATION_VERIFIED)
        self.assertTrue(self.user.is_verified)

    def test_unverify_requires_reason(self):
        # mark user as verified first
        self.user.verification_status = User.VERIFICATION_VERIFIED
        self.user.is_verified = True
        self.user.save()

        url = reverse("admin-users-verify", kwargs={"user_id": self.user.id})
        resp = self.client.post(url, {"action": "unverify"}, format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("rejection_reason", resp.data.get("detail", ""))

    def test_suspend_requires_reason(self):
        url = reverse("admin-users-verify", kwargs={"user_id": self.user.id})
        resp = self.client.post(url, {"action": "suspend"}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_reject_alias_with_reason_sets_unverified(self):
        self.user.verification_status = User.VERIFICATION_VERIFIED
        self.user.save()
        url = reverse("admin-users-verify", kwargs={"user_id": self.user.id})
        resp = self.client.post(url, {"action": "reject", "reason": "doc mismatch"}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.verification_status, User.VERIFICATION_UNVERIFIED)
