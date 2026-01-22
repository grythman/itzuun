"""Escrow and dispute views."""
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.projects.models import Project
from apps.projects.permissions import IsClient, IsFreelancer

from .models import Dispute, Escrow
from .serializers import DisputeSerializer, EscrowSerializer
from .services import (
    approve_escrow,
    confirm_completion,
    create_dispute,
    deposit_to_escrow,
    submit_result,
)


class EscrowDepositView(APIView):
    permission_classes = [IsClient]

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, owner=request.user)
        amount = request.data.get("amount")
        try:
            parsed_amount = int(amount) if amount is not None else None
        except (TypeError, ValueError):
            return Response({"detail": "Invalid amount"}, status=status.HTTP_400_BAD_REQUEST)

        escrow = deposit_to_escrow(project, amount=parsed_amount)
        return Response(EscrowSerializer(escrow).data, status=status.HTTP_201_CREATED)


class EscrowAdminApproveView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, escrow_id):
        escrow = get_object_or_404(Escrow, id=escrow_id)
        approve_escrow(escrow)
        return Response(EscrowSerializer(escrow).data)


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
        platform_fee_pct = request.data.get("platform_fee_pct")
        escrow = confirm_completion(
            project,
            approved_by=request.user,
            platform_fee_pct=int(platform_fee_pct) if platform_fee_pct is not None else None,
        )
        return Response(EscrowSerializer(escrow).data)


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
