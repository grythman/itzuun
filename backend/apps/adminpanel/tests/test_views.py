from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.payments.models import FinancialAuditLog


class AdminUserVerifyTests(TestCase):
    def setUp(self):
        # create admin user
        self.admin = User.objects.create_superuser(
            email="admin@example.com", password="pass"
        )
        # target user
        self.user = User.objects.create_user(
            email="target@example.com", password="pass", role=User.ROLE_CLIENT
        )
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
        resp = self.client.post(
            url, {"action": "reject", "reason": "doc mismatch"}, format="json"
        )
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
        logs = FinancialAuditLog.objects.filter(
            entity_type="user", entity_id=self.user.id, action_type="unsuspend"
        )
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


class AdminAuditLogListTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            email="admin-audit@example.com", password="pass"
        )
        self.client_user = User.objects.create_user(
            email="client-audit@example.com", password="pass", role=User.ROLE_CLIENT
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

        FinancialAuditLog.objects.create(
            actor=self.admin,
            action_type="unsuspend",
            entity_type="user",
            entity_id=self.client_user.id,
            before_state={"verification_status": "suspended"},
            after_state={"verification_status": "verified"},
            reason="appeal accepted",
            hash_chain="h1",
        )
        FinancialAuditLog.objects.create(
            actor=self.admin,
            action_type="approve",
            entity_type="escrow",
            entity_id=1,
            before_state={"status": "created"},
            after_state={"status": "held"},
            reason="admin approval",
            hash_chain="h2",
        )

    def test_list_audit_logs(self):
        url = reverse("admin-audit-logs")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertIn("results", resp.data)
        self.assertGreaterEqual(len(resp.data["results"]), 2)

    def test_filter_audit_logs_by_entity_type(self):
        url = reverse("admin-audit-logs")
        resp = self.client.get(url, {"entity_type": "escrow"})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data["results"]), 1)
        self.assertEqual(resp.data["results"][0]["entity_type"], "escrow")

    def test_requires_admin_permission(self):
        non_admin_client = APIClient()
        non_admin_client.force_authenticate(user=self.client_user)
        url = reverse("admin-audit-logs")
        resp = non_admin_client.get(url)
        self.assertEqual(resp.status_code, 403)
