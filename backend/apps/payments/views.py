"""Escrow and dispute views."""
import logging

from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminUser
from apps.projects.models import Project
from apps.projects.permissions import IsClient, IsFreelancer
from common.exceptions import DomainError

from .models import Dispute, Escrow, Payment
from .idempotency import execute_idempotent
from .serializers import DisputeSerializer, EscrowSerializer, PaymentCreateSerializer, PaymentSerializer
from .services import (
    approve_escrow,
    confirm_completion,
    create_dispute,
    create_invoice,
    deposit_to_escrow,
    mark_payment_failed,
    mark_payment_paid_and_hold_escrow,
    submit_result,
    verify_webhook,
)

logger = logging.getLogger(__name__)


class EscrowDepositView(APIView):
    permission_classes = [IsClient]

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, owner=request.user)

        def _executor():
            escrow = deposit_to_escrow(project, actor=request.user)
            return EscrowSerializer(escrow).data, status.HTTP_201_CREATED

        payload, status_code = execute_idempotent(
            request,
            endpoint=f"POST:/api/v1/projects/{project_id}/escrow/deposit",
            actor=request.user,
            executor=_executor,
        )
        return Response(payload, status=status_code)


class EscrowAdminApproveView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, escrow_id):
        escrow = get_object_or_404(Escrow, id=escrow_id)

        def _executor():
            approved = approve_escrow(escrow, actor=request.user)
            return EscrowSerializer(approved).data, status.HTTP_200_OK

        payload, status_code = execute_idempotent(
            request,
            endpoint=f"POST:/api/v1/escrow/{escrow_id}/admin/approve",
            actor=request.user,
            executor=_executor,
        )
        return Response(payload, status=status_code)


class ProjectSubmitResultView(APIView):
    permission_classes = [IsFreelancer]

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id)
        submit_result(project, submitter=request.user)
        return Response({"status": project.status})


class ProjectConfirmCompletionView(APIView):
    permission_classes = [IsClient]

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, owner=request.user)

        def _executor():
            escrow = confirm_completion(project, approved_by=request.user)
            return EscrowSerializer(escrow).data, status.HTTP_200_OK

        payload, status_code = execute_idempotent(
            request,
            endpoint=f"POST:/api/v1/projects/{project_id}/confirm-completion",
            actor=request.user,
            executor=_executor,
        )
        return Response(payload, status=status_code)


class EscrowReleaseView(APIView):
    permission_classes = [IsClient]

    def post(self, request, escrow_id):
        escrow = get_object_or_404(Escrow.objects.select_related("project"), id=escrow_id)
        project = escrow.project
        if project.owner_id != request.user.id:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        def _executor():
            released = confirm_completion(project, approved_by=request.user)
            return EscrowSerializer(released).data, status.HTTP_200_OK

        payload, status_code = execute_idempotent(
            request,
            endpoint=f"POST:/api/v1/escrow/{escrow_id}/release",
            actor=request.user,
            executor=_executor,
        )
        return Response(payload, status=status_code)


class ProjectDisputeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id)
        dispute = create_dispute(
            project,
            raised_by=request.user,
            reason=request.data.get("reason", ""),
            evidence_files=request.data.get("evidence_files", []),
        )
        return Response(DisputeSerializer(dispute).data, status=status.HTTP_201_CREATED)


class PaymentCreateView(APIView):
    permission_classes = [IsClient]

    def post(self, request):
        serializer = PaymentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project_id = serializer.validated_data["project_id"]

        project = get_object_or_404(Project.objects.select_related("selected_proposal"), id=project_id, owner=request.user)
        if not project.selected_proposal:
            return Response({"detail": "Accepted proposal is required before payment."}, status=status.HTTP_400_BAD_REQUEST)

        amount = project.selected_proposal.price
        callback_url = settings.QPAY_CALLBACK_URL or request.build_absolute_uri("/api/v1/payments/webhook/")
        if not settings.DEBUG and not callback_url.startswith("https://"):
            return Response({"detail": "QPAY_CALLBACK_URL must use HTTPS in non-debug mode."}, status=status.HTTP_400_BAD_REQUEST)

        def _executor():
            existing_payment = (
                Payment.objects.select_related("project")
                .filter(project=project, status=Payment.STATUS_PENDING)
                .order_by("-created_at")
                .first()
            )
            if existing_payment and existing_payment.created_at > timezone.now() - timezone.timedelta(minutes=30):
                return (
                    {
                        "payment": PaymentSerializer(existing_payment).data,
                        "invoice_id": existing_payment.invoice_id,
                        "qr_text": existing_payment.raw_response.get("qr_text", ""),
                        "qr_image": existing_payment.raw_response.get("qr_image", ""),
                        "invoice_url": existing_payment.raw_response.get("invoice_url", ""),
                        "expires_in_seconds": 1800,
                    },
                    status.HTTP_200_OK,
                )

            invoice = create_invoice(project=project, amount=amount, callback_url=callback_url)
            payment = Payment.objects.create(
                project=project,
                invoice_id=invoice.invoice_id,
                amount=amount,
                status=Payment.STATUS_PENDING,
                raw_response=invoice.raw_response,
            )
            return (
                {
                    "payment": PaymentSerializer(payment).data,
                    "invoice_id": invoice.invoice_id,
                    "qr_text": invoice.qr_text,
                    "qr_image": invoice.qr_image,
                    "invoice_url": invoice.invoice_url,
                    "expires_in_seconds": 1800,
                },
                status.HTTP_201_CREATED,
            )

        payload, status_code = execute_idempotent(
            request,
            endpoint="POST:/api/v1/payments/create/",
            actor=request.user,
            executor=_executor,
        )
        return Response(payload, status=status_code)


@method_decorator(csrf_exempt, name="dispatch")
class PaymentWebhookView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        if not settings.DEBUG and not request.is_secure():
            logger.warning("Rejected non-HTTPS webhook request")
            return Response({"detail": "HTTPS required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            verified = verify_webhook(request)
        except DomainError as exc:
            logger.warning("Invalid payment webhook: %s", exc)
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment = Payment.objects.get(invoice_id=verified["invoice_id"])
        except Payment.DoesNotExist:
            logger.warning("Webhook invoice not found: %s", verified.get("invoice_id"))
            return Response({"detail": "Unknown invoice"}, status=status.HTTP_400_BAD_REQUEST)

        if not verified["is_paid"]:
            mark_payment_failed(payment, reason="invoice_not_paid", raw_payload=verified)
            return Response({"detail": "Invoice not paid"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment = mark_payment_paid_and_hold_escrow(
                invoice_id=verified["invoice_id"],
                paid_amount=verified["amount"],
                verification_payload=verified,
            )
        except DomainError as exc:
            logger.warning("Webhook payment processing failed for invoice %s: %s", verified["invoice_id"], exc)
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        if payment.status != Payment.STATUS_PAID:
            logger.warning("Webhook payment marked as failed for invoice %s", verified["invoice_id"])
            return Response({"detail": "Payment verification failed"}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"verified": True, "payment": PaymentSerializer(payment).data}, status=status.HTTP_200_OK)


class PaymentStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, project_id):
        project = get_object_or_404(Project.objects.select_related("selected_proposal", "owner"), id=project_id)
        is_participant = request.user.id in {
            project.owner_id,
            getattr(getattr(project, "selected_proposal", None), "freelancer_id", None),
        }
        if not is_participant and request.user.role != "admin":
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        payment = project.payments.order_by("-created_at").first()
        if payment is None:
            return Response({"detail": "No payment found"}, status=status.HTTP_404_NOT_FOUND)

        if payment.status == Payment.STATUS_PENDING and payment.created_at < timezone.now() - timezone.timedelta(minutes=30):
            payment = mark_payment_failed(payment, reason="invoice_expired")

        return Response(PaymentSerializer(payment).data, status=status.HTTP_200_OK)
