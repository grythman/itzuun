from datetime import timedelta
from unittest.mock import patch

from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.payments.models import Escrow, LedgerEntry, Payment
from apps.payments.services.qpay_service import QPayInvoice
from apps.payments.services import calculate_commission, mark_payment_paid_and_hold_escrow
from apps.projects.models import Project, Proposal


class QPayIntegrationTests(TestCase):
    def setUp(self):
        self.client_api = APIClient()
        self.client_user = User.objects.create_user(email="client-qpay@test.com", role="client", password="pass1234")
        self.freelancer = User.objects.create_user(email="freelancer-qpay@test.com", role="freelancer", password="pass1234")

        self.project = Project.objects.create(
            owner=self.client_user,
            title="QPay Project",
            description="Payment test",
            budget=1_000_000,
            timeline_days=10,
            category="web",
            status=Project.STATUS_IN_PROGRESS,
        )
        self.proposal = Proposal.objects.create(
            project=self.project,
            freelancer=self.freelancer,
            price=1_000_000,
            timeline_days=7,
            message="proposal",
            status=Proposal.STATUS_ACCEPTED,
        )
        self.project.selected_proposal = self.proposal
        self.project.save(update_fields=["selected_proposal"])

    @patch("apps.payments.views.create_invoice")
    def test_successful_payment_flow(self, create_invoice_mock):
        create_invoice_mock.return_value = QPayInvoice(
            invoice_id="inv-100",
            qr_text="qpay://qr",
            qr_image="https://cdn/qr.png",
            invoice_url="https://qpay.mn/inv-100",
            raw_response={
                "invoice_id": "inv-100",
                "qr_text": "qpay://qr",
                "qr_image": "https://cdn/qr.png",
                "invoice_url": "https://qpay.mn/inv-100",
            },
        )

        with override_settings(DEBUG=True):
            self.client_api.force_authenticate(self.client_user)
            create_response = self.client_api.post(
                "/api/v1/payments/create/",
                {"project_id": self.project.id},
                format="json",
                HTTP_IDEMPOTENCY_KEY="pay-create-1",
            )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)

        with override_settings(DEBUG=True):
            with patch("apps.payments.views.verify_webhook") as verify_mock:
                verify_mock.return_value = {
                    "invoice_id": "inv-100",
                    "is_paid": True,
                    "amount": 1_000_000,
                    "payload": {"invoice_id": "inv-100"},
                    "verification": {"status": "paid", "amount": 1_000_000},
                }
                webhook_response = self.client_api.post("/api/v1/payments/webhook/", data={"invoice_id": "inv-100"}, format="json")

        self.assertEqual(webhook_response.status_code, status.HTTP_200_OK)
        payment = Payment.objects.get(invoice_id="inv-100")
        escrow = Escrow.objects.get(project=self.project)
        self.assertEqual(payment.status, Payment.STATUS_PAID)
        self.assertEqual(escrow.status, Escrow.STATUS_HELD)

    def test_duplicate_webhook_call_is_idempotent(self):
        payment = Payment.objects.create(project=self.project, invoice_id="inv-dup", amount=1_000_000)

        first = mark_payment_paid_and_hold_escrow(
            invoice_id=payment.invoice_id,
            paid_amount=1_000_000,
            verification_payload={"status": "paid"},
        )
        second = mark_payment_paid_and_hold_escrow(
            invoice_id=payment.invoice_id,
            paid_amount=1_000_000,
            verification_payload={"status": "paid"},
        )

        self.assertEqual(first.status, Payment.STATUS_PAID)
        self.assertEqual(second.status, Payment.STATUS_PAID)
        escrow = Escrow.objects.get(project=self.project)
        self.assertEqual(escrow.ledger_entries.filter(entry_type=LedgerEntry.TYPE_DEPOSIT).count(), 1)

    @override_settings(DEBUG=True, QPAY_WEBHOOK_SECRET="secret")
    def test_fake_webhook_attempt_rejected(self):
        response = self.client_api.post("/api/v1/payments/webhook/", data={"invoice_id": "inv-fake"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_partial_payment_attempt_marks_failed(self):
        payment = Payment.objects.create(project=self.project, invoice_id="inv-partial", amount=1_000_000)

        mark_payment_paid_and_hold_escrow(
            invoice_id=payment.invoice_id,
            paid_amount=500_000,
            verification_payload={"status": "paid"},
        )

        payment.refresh_from_db()
        self.assertEqual(payment.status, Payment.STATUS_FAILED)

    def test_invoice_expired_status_check_marks_failed(self):
        payment = Payment.objects.create(project=self.project, invoice_id="inv-expired", amount=1_000_000, status=Payment.STATUS_PENDING)
        Payment.objects.filter(id=payment.id).update(created_at=timezone.now() - timedelta(minutes=31))

        self.client_api.force_authenticate(self.client_user)
        response = self.client_api.get(f"/api/v1/payments/status/{self.project.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        payment.refresh_from_db()
        self.assertEqual(payment.status, Payment.STATUS_FAILED)

    def test_commission_calculation_correct(self):
        platform_fee, freelancer_amount = calculate_commission(1_000_000)
        self.assertEqual(platform_fee, 120_000)
        self.assertEqual(freelancer_amount, 880_000)
