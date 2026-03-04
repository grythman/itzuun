from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.messaging.models import ProjectFile
from apps.payments.models import Escrow, LedgerEntry
from apps.payments.services import deposit_to_escrow
from apps.projects.models import Project, ProjectDeliverable, Proposal
from common.exceptions import DomainError


class EscrowAbuseMatrixTests(TestCase):
    def setUp(self):
        self.client_api = APIClient()
        self.owner = User.objects.create_user(email="owner@test.com", role="client", password="pass1234")
        self.freelancer = User.objects.create_user(email="freelancer@test.com", role="freelancer", password="pass1234")
        self.admin = User.objects.create_user(email="admin@test.com", role="admin", password="pass1234")

    def _build_project_in_progress(self, price=1000000):
        project = Project.objects.create(
            owner=self.owner,
            title="Test Project",
            description="desc",
            budget=price,
            timeline_days=10,
            category="web",
            status=Project.STATUS_OPEN,
        )
        proposal = Proposal.objects.create(
            project=project,
            freelancer=self.freelancer,
            price=price,
            timeline_days=7,
            message="proposal",
        )
        project.status = Project.STATUS_IN_PROGRESS
        project.selected_proposal = proposal
        project.save(update_fields=["status", "selected_proposal"])
        return project, proposal

    def _hold_escrow(self, project: Project, amount: int):
        return Escrow.objects.create(project=project, amount=amount, status=Escrow.STATUS_HELD)

    def test_negative_fee_returns_400(self):
        self.client_api.force_authenticate(self.admin)
        response = self.client_api.patch(
            "/api/v1/admin/settings/commission",
            {"platform_fee_pct": -1},
            format="json",
            HTTP_IDEMPOTENCY_KEY="fee-neg-1",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_fee_above_cap_returns_400(self):
        self.client_api.force_authenticate(self.admin)
        response = self.client_api.patch(
            "/api/v1/admin/settings/commission",
            {"platform_fee_pct": 31},
            format="json",
            HTTP_IDEMPOTENCY_KEY="fee-cap-1",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_underfund_deposit_blocked(self):
        project, proposal = self._build_project_in_progress(price=1000000)
        with self.assertRaises(DomainError):
            deposit_to_escrow(project, actor=self.owner, amount=proposal.price - 1)

    def test_submit_result_without_deliverable_returns_400(self):
        project, proposal = self._build_project_in_progress(price=500000)
        self._hold_escrow(project, proposal.price)

        self.client_api.force_authenticate(self.freelancer)
        response = self.client_api.post(f"/api/v1/projects/{project.id}/submit-result", format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_double_confirm_completion_idempotent(self):
        project, proposal = self._build_project_in_progress(price=700000)
        self._hold_escrow(project, proposal.price)
        file_obj = ProjectFile.objects.create(
            project=project,
            uploader=self.freelancer,
            file="project_files/dummy.txt",
            name="dummy.txt",
            size=1,
        )
        ProjectDeliverable.objects.create(
            project=project,
            file=file_obj,
            submitted_by=self.freelancer,
            description="done",
            checksum="abc123",
        )
        project.status = Project.STATUS_AWAITING_REVIEW
        project.save(update_fields=["status"])

        self.client_api.force_authenticate(self.owner)
        first = self.client_api.post(
            f"/api/v1/projects/{project.id}/confirm-completion",
            format="json",
            HTTP_IDEMPOTENCY_KEY="complete-key-1",
        )
        second = self.client_api.post(
            f"/api/v1/projects/{project.id}/confirm-completion",
            format="json",
            HTTP_IDEMPOTENCY_KEY="complete-key-1",
        )

        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertEqual(first.json(), second.json())
        escrow = Escrow.objects.get(project=project)
        self.assertEqual(escrow.status, Escrow.STATUS_RELEASED)
        self.assertEqual(escrow.ledger_entries.filter(entry_type=LedgerEntry.TYPE_RELEASE).count(), 1)
        self.assertEqual(escrow.ledger_entries.filter(entry_type=LedgerEntry.TYPE_FEE).count(), 1)

    def test_dispute_then_confirm_completion_is_blocked(self):
        project, proposal = self._build_project_in_progress(price=450000)
        self._hold_escrow(project, proposal.price)

        self.client_api.force_authenticate(self.owner)
        dispute_resp = self.client_api.post(
            f"/api/v1/projects/{project.id}/dispute",
            {"reason": "race check", "evidence_files": []},
            format="json",
        )
        self.assertEqual(dispute_resp.status_code, status.HTTP_201_CREATED)

        complete_resp = self.client_api.post(
            f"/api/v1/projects/{project.id}/confirm-completion",
            format="json",
            HTTP_IDEMPOTENCY_KEY="race-confirm-1",
        )
        self.assertEqual(complete_resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_replay_deposit_request_is_idempotent(self):
        project, proposal = self._build_project_in_progress(price=300000)

        self.client_api.force_authenticate(self.owner)
        first = self.client_api.post(
            f"/api/v1/projects/{project.id}/escrow/deposit",
            format="json",
            HTTP_IDEMPOTENCY_KEY="deposit-key-1",
        )
        second = self.client_api.post(
            f"/api/v1/projects/{project.id}/escrow/deposit",
            format="json",
            HTTP_IDEMPOTENCY_KEY="deposit-key-1",
        )

        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second.status_code, status.HTTP_201_CREATED)
        self.assertEqual(first.json(), second.json())
        escrow = Escrow.objects.get(project=project)
        self.assertEqual(escrow.amount, proposal.price)
        self.assertEqual(escrow.ledger_entries.filter(entry_type=LedgerEntry.TYPE_DEPOSIT).count(), 1)


class CacheInvalidationSmokeTests(TestCase):
    def setUp(self):
        self.client_api = APIClient()
        self.owner = User.objects.create_user(email="owner-cache@test.com", role="client", password="pass1234")
        self.freelancer = User.objects.create_user(
            email="freelancer-cache@test.com", role="freelancer", password="pass1234"
        )
        self.admin = User.objects.create_user(email="admin-cache@test.com", role="admin", password="pass1234")

    def test_admin_users_list_invalidation_after_verify(self):
        target = User.objects.create_user(email="pending-cache@test.com", role="client", password="pass1234")

        self.client_api.force_authenticate(self.admin)
        first = self.client_api.get("/api/v1/admin/users", {"verified": "false"})
        self.assertEqual(first.status_code, status.HTTP_200_OK)
        first_ids = [item["id"] for item in first.json()["results"]]
        self.assertIn(target.id, first_ids)

        verify = self.client_api.post(f"/api/v1/admin/users/{target.id}/verify", format="json")
        self.assertEqual(verify.status_code, status.HTTP_200_OK)

        second = self.client_api.get("/api/v1/admin/users", {"verified": "false"})
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        second_ids = [item["id"] for item in second.json()["results"]]
        self.assertNotIn(target.id, second_ids)

    def test_admin_projects_list_invalidation_after_project_create(self):
        self.client_api.force_authenticate(self.admin)
        first = self.client_api.get("/api/v1/admin/projects", {"status": "open"})
        self.assertEqual(first.status_code, status.HTTP_200_OK)
        before_count = first.json()["count"]

        self.client_api.force_authenticate(self.owner)
        create = self.client_api.post(
            "/api/v1/projects",
            {
                "title": "Cache Project",
                "description": "cache test",
                "budget": 120000,
                "timeline_days": 7,
                "category": "web",
            },
            format="json",
        )
        self.assertEqual(create.status_code, status.HTTP_201_CREATED)

        self.client_api.force_authenticate(self.admin)
        second = self.client_api.get("/api/v1/admin/projects", {"status": "open"})
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertEqual(second.json()["count"], before_count + 1)

    def test_profile_me_cache_invalidation_after_patch(self):
        self.client_api.force_authenticate(self.owner)

        first = self.client_api.get("/api/v1/profiles/me")
        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertEqual(first.json()["full_name"], "")

        patch = self.client_api.patch("/api/v1/profiles/me", {"full_name": "Cache Updated"}, format="json")
        self.assertEqual(patch.status_code, status.HTTP_200_OK)

        second = self.client_api.get("/api/v1/profiles/me")
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertEqual(second.json()["full_name"], "Cache Updated")

    def test_reviews_summary_and_list_invalidation_after_review_create(self):
        project = Project.objects.create(
            owner=self.owner,
            title="Completed Project",
            description="desc",
            budget=500000,
            timeline_days=10,
            category="web",
            status=Project.STATUS_COMPLETED,
        )
        proposal = Proposal.objects.create(
            project=project,
            freelancer=self.freelancer,
            price=500000,
            timeline_days=8,
            message="proposal",
            status=Proposal.STATUS_ACCEPTED,
        )
        project.selected_proposal = proposal
        project.save(update_fields=["selected_proposal"])

        self.client_api.force_authenticate(self.owner)
        summary_before = self.client_api.get(f"/api/v1/users/{self.freelancer.id}/rating-summary")
        reviews_before = self.client_api.get(f"/api/v1/users/{self.freelancer.id}/reviews")
        self.assertEqual(summary_before.status_code, status.HTTP_200_OK)
        self.assertEqual(reviews_before.status_code, status.HTTP_200_OK)
        self.assertEqual(summary_before.json()["total"], 0)
        self.assertEqual(reviews_before.json()["count"], 0)

        self.client_api.force_authenticate(self.owner)
        create = self.client_api.post(
            f"/api/v1/projects/{project.id}/reviews",
            {"rating": 5, "comment": "great"},
            format="json",
        )
        self.assertEqual(create.status_code, status.HTTP_201_CREATED)

        summary_after = self.client_api.get(f"/api/v1/users/{self.freelancer.id}/rating-summary")
        reviews_after = self.client_api.get(f"/api/v1/users/{self.freelancer.id}/reviews")
        self.assertEqual(summary_after.status_code, status.HTTP_200_OK)
        self.assertEqual(reviews_after.status_code, status.HTTP_200_OK)
        self.assertEqual(summary_after.json()["total"], 1)
        self.assertEqual(summary_after.json()["average"], 5)
        self.assertEqual(reviews_after.json()["count"], 1)


class MvPHappyPathApiTests(TestCase):
    def setUp(self):
        self.client_api = APIClient()
        self.client_user = User.objects.create_user(email="client-e2e@test.com", role="client", password="pass1234")
        self.freelancer = User.objects.create_user(email="freelancer-e2e@test.com", role="freelancer", password="pass1234")
        self.admin = User.objects.create_user(email="admin-e2e@test.com", role="admin", password="pass1234")

    def test_e2e_happy_path_project_to_review(self):
        self.client_api.force_authenticate(self.admin)
        verify_resp = self.client_api.post(f"/api/v1/admin/users/{self.freelancer.id}/verify", format="json")
        self.assertEqual(verify_resp.status_code, status.HTTP_200_OK)

        self.client_api.force_authenticate(self.client_user)
        create_project = self.client_api.post(
            "/api/v1/projects",
            {
                "title": "E2E Project",
                "description": "End-to-end happy path",
                "budget": 900000,
                "timeline_days": 10,
                "category": "web",
            },
            format="json",
        )
        self.assertEqual(create_project.status_code, status.HTTP_201_CREATED)
        project_id = create_project.json()["id"]

        self.client_api.force_authenticate(self.freelancer)
        submit_proposal = self.client_api.post(
            f"/api/v1/projects/{project_id}/proposals",
            {
                "price": 850000,
                "timeline_days": 9,
                "message": "Ready to deliver",
            },
            format="json",
        )
        self.assertEqual(submit_proposal.status_code, status.HTTP_201_CREATED)
        proposal_id = submit_proposal.json()["id"]

        self.client_api.force_authenticate(self.client_user)
        select_resp = self.client_api.post(
            f"/api/v1/projects/{project_id}/select-freelancer",
            {"proposal_id": proposal_id},
            format="json",
        )
        self.assertEqual(select_resp.status_code, status.HTTP_200_OK)

        deposit_resp = self.client_api.post(
            f"/api/v1/projects/{project_id}/escrow/deposit",
            format="json",
            HTTP_IDEMPOTENCY_KEY="e2e-deposit-key",
        )
        self.assertEqual(deposit_resp.status_code, status.HTTP_201_CREATED)
        escrow_id = deposit_resp.json()["id"]

        self.client_api.force_authenticate(self.admin)
        approve_resp = self.client_api.post(
            f"/api/v1/escrow/{escrow_id}/admin/approve",
            format="json",
            HTTP_IDEMPOTENCY_KEY="e2e-approve-key",
        )
        self.assertEqual(approve_resp.status_code, status.HTTP_200_OK)

        self.client_api.force_authenticate(self.freelancer)
        project = Project.objects.get(id=project_id)
        file_obj = ProjectFile.objects.create(
            project=project,
            uploader=self.freelancer,
            file="project_files/e2e.txt",
            name="e2e.txt",
            size=3,
        )
        file_id = file_obj.id

        deliverable = self.client_api.post(
            f"/api/v1/projects/{project_id}/deliverables",
            {
                "file_id": file_id,
                "checksum": "e2e-checksum",
                "description": "Final delivery",
            },
            format="json",
        )
        self.assertEqual(deliverable.status_code, status.HTTP_201_CREATED)

        submit_result_resp = self.client_api.post(f"/api/v1/projects/{project_id}/submit-result", format="json")
        self.assertEqual(submit_result_resp.status_code, status.HTTP_200_OK)

        self.client_api.force_authenticate(self.client_user)
        release_resp = self.client_api.post(
            f"/api/v1/projects/{project_id}/confirm-completion",
            format="json",
            HTTP_IDEMPOTENCY_KEY="e2e-release-key",
        )
        self.assertEqual(release_resp.status_code, status.HTTP_200_OK)

        review_resp = self.client_api.post(
            f"/api/v1/projects/{project_id}/reviews",
            {"rating": 5, "comment": "Great freelancer"},
            format="json",
        )
        self.assertEqual(review_resp.status_code, status.HTTP_201_CREATED)

        summary_resp = self.client_api.get(f"/api/v1/users/{self.freelancer.id}/rating-summary")
        self.assertEqual(summary_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(summary_resp.json()["total"], 1)
