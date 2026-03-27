
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminUser
from common.exceptions import DomainError
from apps.payments.idempotency import execute_idempotent
from apps.payments.models import Dispute, Escrow
from apps.projects.permissions import IsProjectOwnerForPayment
from apps.payments.serializers import EscrowSerializer, DisputeSerializer
from apps.payments.services import confirm_completion, deposit_to_escrow, create_dispute
from apps.projects.models import Project


class ProjectEscrowDepositView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsProjectOwnerForPayment]

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id)

        def _executor():
            escrow = deposit_to_escrow(project, actor=request.user, amount=project.selected_proposal.price)
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
                    {"error": f"Escrow is not in created state. Current state: {escrow.status}"},
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
                status=status.HTTP_400_BAD_REQUEST
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
            return Response(DisputeSerializer(dispute).data, status=status.HTTP_201_CREATED)
        except DomainError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
