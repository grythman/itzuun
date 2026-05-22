from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminUser
from apps.payments.idempotency import execute_idempotent
from apps.payments.models import Dispute, Escrow, Payment
from apps.payments.serializers import (
    DisputeSerializer,
    EscrowSerializer,
    PaymentSerializer,
)
from apps.payments.services import (
    confirm_completion,
    create_dispute,
    create_invoice,
    deposit_to_escrow,
    mark_payment_failed,
    mark_payment_paid_and_hold_escrow,
)
from apps.payments.services.qpay_service import get_invoice_status
from apps.projects.models import Project
from apps.projects.permissions import IsProjectOwnerForPayment
from common.exceptions import DomainError


def _ensure_project_owner_or_403(request, project: Project):
    if project.owner_id != request.user.id:
        return Response(
            {"detail": "You do not have permission to perform this action."},
            status=status.HTTP_403_FORBIDDEN,
        )
    return None


class ProjectPaymentCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsProjectOwnerForPayment]

    def post(self, request, project_id):
        project = get_object_or_404(
            Project.objects.select_related("selected_proposal"), id=project_id
        )
        forbidden = _ensure_project_owner_or_403(request, project)
        if forbidden:
            return forbidden

        if not project.selected_proposal:
            return Response(
                {"error": "No selected proposal for this project."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        latest_payment = (
            Payment.objects.filter(project=project).order_by("-created_at").first()
        )
        if latest_payment and latest_payment.status == Payment.STATUS_PENDING:
            existing = latest_payment.raw_response or {}
            return Response(
                {
                    "invoice_id": latest_payment.invoice_id,
                    "invoice_url": existing.get("invoice_url", ""),
                    "qr_text": existing.get("qr_text", ""),
                    "qr_image": existing.get("qr_image", ""),
                    "expires_in_seconds": 900,
                    "payment": PaymentSerializer(latest_payment).data,
                },
                status=status.HTTP_200_OK,
            )

        amount = project.selected_proposal.price
        callback_url = settings.QPAY_CALLBACK_URL or request.build_absolute_uri(
            "/api/v1/payments/webhook/"
        )

        try:
            invoice = create_invoice(
                project=project, amount=amount, callback_url=callback_url
            )
        except DomainError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        payment = Payment.objects.create(
            project=project,
            invoice_id=invoice.invoice_id,
            amount=amount,
            status=Payment.STATUS_PENDING,
            raw_response={
                **(invoice.raw_response or {}),
                "invoice_url": invoice.invoice_url,
                "qr_text": invoice.qr_text,
                "qr_image": invoice.qr_image,
            },
        )

        return Response(
            {
                "invoice_id": invoice.invoice_id,
                "invoice_url": invoice.invoice_url,
                "qr_text": invoice.qr_text,
                "qr_image": invoice.qr_image,
                "expires_in_seconds": 900,
                "payment": PaymentSerializer(payment).data,
            },
            status=status.HTTP_201_CREATED,
        )


class ProjectPaymentStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsProjectOwnerForPayment]

    def get(self, request, project_id):
        project = get_object_or_404(Project, id=project_id)
        forbidden = _ensure_project_owner_or_403(request, project)
        if forbidden:
            return forbidden

        payment = (
            Payment.objects.filter(project=project).order_by("-created_at").first()
        )
        if not payment:
            return Response(
                {"error": "Payment not found for this project."},
                status=status.HTTP_404_NOT_FOUND,
            )

        verification_payload = {}
        if payment.status == Payment.STATUS_PENDING:
            try:
                verification_payload = get_invoice_status(payment.invoice_id)
            except DomainError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

            payment_flag = str(
                verification_payload.get("payment_status")
                or verification_payload.get("status")
                or ""
            ).lower()
            if payment_flag in {"paid", "success", "succeeded"}:
                paid_amount = int(verification_payload.get("amount") or payment.amount)
                try:
                    mark_payment_paid_and_hold_escrow(
                        invoice_id=payment.invoice_id,
                        paid_amount=paid_amount,
                        verification_payload=verification_payload,
                    )
                except DomainError as e:
                    return Response(
                        {"error": str(e)}, status=status.HTTP_400_BAD_REQUEST
                    )
                payment.refresh_from_db()
            elif payment_flag in {"failed", "expired", "canceled", "cancelled"}:
                mark_payment_failed(
                    payment,
                    reason=f"qpay_status:{payment_flag}",
                    raw_payload=verification_payload,
                )
                payment.refresh_from_db()

        return Response(
            {
                "invoice_id": payment.invoice_id,
                "status": payment.status,
                "payment": PaymentSerializer(payment).data,
                "verification": verification_payload,
            },
            status=status.HTTP_200_OK,
        )


class ProjectEscrowDepositView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsProjectOwnerForPayment]

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id)

        def _executor():
            escrow = deposit_to_escrow(
                project, actor=request.user, amount=project.selected_proposal.price
            )
            return EscrowSerializer(escrow).data, status.HTTP_201_CREATED

        payload, status_code = execute_idempotent(request, _executor)
        return Response(payload, status=status_code)


class EscrowAdminApproveView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, escrow_id):
        def _executor():
            escrow = get_object_or_404(Escrow, id=escrow_id)
            if escrow.status == Escrow.STATUS_HELD:
                return EscrowSerializer(escrow).data, status.HTTP_200_OK
            if escrow.status != Escrow.STATUS_CREATED:
                return (
                    {
                        "error": f"Escrow is not in created state. Current state: {escrow.status}"
                    },
                    status.HTTP_400_BAD_REQUEST,
                )
            escrow.status = Escrow.STATUS_HELD
            escrow.save()
            return EscrowSerializer(escrow).data, status.HTTP_200_OK

        result = execute_idempotent(request, _executor)
        if isinstance(result, tuple):
            payload, status_code = result
            return Response(payload, status=status_code)
        return result


class ProjectConfirmCompletionView(APIView):
    permission_classes = [IsProjectOwnerForPayment]

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id)

        # 1. ХАМГИЙН ТҮРҮҮНД: Маргаан байгаа бол 400 буцаах
        from apps.payments.models import Dispute

        if Dispute.objects.filter(project=project, resolved_at__isnull=True).exists():
            return Response(
                {"error": "Project has an unresolved dispute."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 2. Idempotency логик руу орох (Дотор нь completed-ийг шалгахгүй)
        def _executor():
            from apps.payments.services import confirm_completion

            confirm_completion(project, approved_by=request.user)
            return {"status": "completed"}, status.HTTP_200_OK

        from apps.payments.idempotency import execute_idempotent

        payload, status_code = execute_idempotent(request, _executor)
        return Response(payload, status=status_code)


class ProjectDisputeView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsProjectOwnerForPayment]

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id)
        serializer = DisputeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            dispute = create_dispute(
                project=project,
                raised_by=request.user,
                reason=serializer.validated_data.get("reason", ""),
                evidence_files=serializer.validated_data.get("evidence_files", []),
            )
            return Response(
                DisputeSerializer(dispute).data, status=status.HTTP_201_CREATED
            )
        except DomainError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
