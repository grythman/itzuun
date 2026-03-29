from django.test import TestCase
from rest_framework.test import APIClient
from django.urls import reverse

from apps.accounts.models import User
from apps.payments.models import FinancialAuditLog


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

    def test_unsuspend_flow(self):
        # suspend the user first
        self.user.verification_status = User.VERIFICATION_SUSPENDED
        self.user.is_active = False
        self.user.save()

        url = reverse("admin-users-unsuspend", kwargs={"user_id": self.user.id})
        resp = self.client.post(url, {"reason": "appeal accepted"}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.verification_status, User.VERIFICATION_VERIFIED)
        self.assertTrue(self.user.is_verified)
        self.assertTrue(self.user.is_active)

    def test_unsuspend_only_from_suspended(self):
        # user is unverified by default; unsuspend should fail
        url = reverse("admin-users-unsuspend", kwargs={"user_id": self.user.id})
        resp = self.client.post(url, {"reason": "appeal accepted"}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_unsuspend_creates_audit_log(self):
        # suspend the user first
        self.user.verification_status = User.VERIFICATION_SUSPENDED
        self.user.is_active = False
        self.user.save()

        url = reverse("admin-users-unsuspend", kwargs={"user_id": self.user.id})
        resp = self.client.post(url, {"reason": "appeal accepted"}, format="json")
        self.assertEqual(resp.status_code, 200)
        # verify audit log created
        logs = FinancialAuditLog.objects.filter(entity_type="user", entity_id=self.user.id, action_type="unsuspend")
        self.assertTrue(logs.exists())

    def test_unsuspend_cannot_unsuspend_self(self):
        self.admin.verification_status = User.VERIFICATION_SUSPENDED
        self.admin.is_active = False
        self.admin.save()
        url = reverse("admin-users-unsuspend", kwargs={"user_id": self.admin.id})
        resp = self.client.post(url, {"reason": "self appeal"}, format="json")
        self.assertEqual(resp.status_code, 403)


class AdminUserUnsuspendPermissionTests(TestCase):
    def setUp(self):
        self.non_admin = User.objects.create_user(
            email="client@example.com",
            password="pass",
            role=User.ROLE_CLIENT,
        )
        self.target = User.objects.create_user(
            email="suspended@example.com",
            password="pass",
            role=User.ROLE_FREELANCER,
        )
        self.target.verification_status = User.VERIFICATION_SUSPENDED
        self.target.is_active = False
        self.target.save()
        self.client = APIClient()
        self.client.force_authenticate(user=self.non_admin)

    def test_unsuspend_requires_admin_permission(self):
        url = reverse("admin-users-unsuspend", kwargs={"user_id": self.target.id})
        resp = self.client.post(url, {"reason": "appeal accepted"}, format="json")
        self.assertEqual(resp.status_code, 403)
