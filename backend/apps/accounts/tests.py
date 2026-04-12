from django.test import TestCase
from django.core.management import call_command
from django.core.management.base import CommandError
from io import StringIO
import json
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.projects.models import Project


class PasswordAuthApiTests(TestCase):
    def setUp(self):
        self.client_api = APIClient()

    def test_register_creates_user_and_authenticates(self):
        response = self.client_api.post(
            "/api/v1/auth/register",
            {
                "email": "new-user@test.com",
                "password": "Pass12345",
                "role": "freelancer",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.json()["authenticated"])
        self.assertEqual(response.json()["user"]["role"], "freelancer")
        self.assertTrue(User.objects.filter(email="new-user@test.com").exists())

    def test_login_authenticates_existing_user(self):
        user = User.objects.create_user(
            email="login-user@test.com", password="Pass12345", role="client"
        )

        response = self.client_api.post(
            "/api/v1/auth/login",
            {
                "email": user.email,
                "password": "Pass12345",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.json()["authenticated"])
        self.assertEqual(response.json()["user"]["email"], user.email)


class VerificationSubmitApiTests(TestCase):
    def setUp(self):
        self.client_api = APIClient()
        self.user = User.objects.create_user(
            email="verify-me@test.com", password="Pass12345", role="freelancer"
        )
        self.client_api.force_authenticate(user=self.user)

    def test_submit_verification_sets_pending_and_normalizes_phone(self):
        response = self.client_api.post(
            "/api/v1/users/me/verification",
            {"verification_type": "individual", "phone": "+976 9911-2233"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.verification_status, User.VERIFICATION_PENDING)
        self.assertEqual(self.user.phone, "+97699112233")
        self.assertFalse(self.user.is_verified)

    def test_submit_verification_rejects_invalid_phone(self):
        response = self.client_api.post(
            "/api/v1/users/me/verification",
            {"verification_type": "individual", "phone": "12-ab"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_submit_verification_blocked_when_pending(self):
        self.user.verification_status = User.VERIFICATION_PENDING
        self.user.save(update_fields=["verification_status"])
        response = self.client_api.post(
            "/api/v1/users/me/verification",
            {"verification_type": "individual", "phone": "99112233"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class SetupPilotCohortCommandTests(TestCase):
    def test_command_generates_validation_report(self):
        client = User.objects.create_user(
            email="pilot-client@test.com", password="Pass12345", role="client"
        )
        freelancer = User.objects.create_user(
            email="pilot-freelancer@test.com", password="Pass12345", role="freelancer"
        )
        project = Project.objects.create(
            owner=client,
            title="Pilot project",
            description="Pilot project for cohort",
            budget=100000,
            timeline_days=7,
            category="web",
            required_skills=["django"],
        )
        stdout = StringIO()
        call_command(
            "setup_pilot_cohort",
            clients="pilot-client@test.com,missing-client@test.com",
            freelancers="pilot-freelancer@test.com",
            projects=f"{project.id},99999",
            stdout=stdout,
        )
        payload = json.loads(stdout.getvalue())
        self.assertEqual(payload["summary"]["client_total"], 2)
        self.assertEqual(payload["summary"]["freelancer_total"], 1)
        self.assertEqual(payload["summary"]["project_total"], 2)
        self.assertEqual(payload["missing"]["clients"], ["missing-client@test.com"])
        self.assertEqual(payload["missing"]["projects"], [99999])

    def test_command_strict_mode_raises_on_missing(self):
        stdout = StringIO()
        with self.assertRaises(CommandError):
            call_command(
                "setup_pilot_cohort",
                clients="missing-client@test.com",
                strict=True,
                stdout=stdout,
            )


class PremiumApiTests(TestCase):
    def setUp(self):
        self.client_api = APIClient()

    def test_premium_me_requires_authentication(self):
        response = self.client_api.get("/api/v1/premium/me")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_freelancer_subscribe_and_cancel(self):
        user = User.objects.create_user(
            email="pro-freelancer@test.com", password="Pass12345", role="freelancer"
        )
        self.client_api.force_authenticate(user=user)

        subscribe = self.client_api.post(
            "/api/v1/premium/subscribe", {"plan_type": "pro_monthly"}, format="json"
        )
        self.assertEqual(subscribe.status_code, status.HTTP_200_OK)
        self.assertTrue(subscribe.json()["subscribed"])

        user.refresh_from_db()
        self.assertTrue(user.is_premium)
        self.assertEqual(user.premium_plan_type, "pro_monthly")
        self.assertIsNotNone(user.premium_expiry)

        me = self.client_api.get("/api/v1/premium/me")
        self.assertEqual(me.status_code, status.HTTP_200_OK)
        self.assertEqual(me.json()["tier"], "premium_freelancer")
        self.assertEqual(me.json()["proposal_limit_monthly"], 50)

        cancel = self.client_api.post("/api/v1/premium/cancel", {}, format="json")
        self.assertEqual(cancel.status_code, status.HTTP_200_OK)
        self.assertTrue(cancel.json()["canceled"])

        user.refresh_from_db()
        self.assertFalse(user.is_premium)
        self.assertEqual(user.premium_plan_type, "")
        self.assertIsNone(user.premium_expiry)

    def test_client_cannot_subscribe_premium_freelancer_plan(self):
        user = User.objects.create_user(
            email="pro-client@test.com", password="Pass12345", role="client"
        )
        self.client_api.force_authenticate(user=user)

        response = self.client_api.post(
            "/api/v1/premium/subscribe", {"plan_type": "pro_monthly"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
