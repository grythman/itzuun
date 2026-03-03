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
