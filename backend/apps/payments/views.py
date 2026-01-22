"""Escrow and dispute views."""
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.projects.models import Project

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
    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, owner=request.user)
        escrow = deposit_to_escrow(project, amount=int(request.data.get("amount", 0)))
        return Response(EscrowSerializer(escrow).data, status=status.HTTP_201_CREATED)


class EscrowAdminApproveView(APIView):
    def post(self, request, escrow_id):
        escrow = get_object_or_404(Escrow, id=escrow_id)
        approve_escrow(escrow)
        return Response(EscrowSerializer(escrow).data)


class ProjectSubmitResultView(APIView):
    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id)
        submit_result(project)
        return Response({"status": project.status})


class ProjectConfirmCompletionView(APIView):
    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id)
        escrow = confirm_completion(project, platform_fee_pct=int(request.data.get("platform_fee_pct", 12)))
        return Response(EscrowSerializer(escrow).data)


class ProjectDisputeView(APIView):
    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id)
        dispute = create_dispute(
            project,
            raised_by=request.user,
            reason=request.data.get("reason", ""),
            evidence_files=request.data.get("evidence_files", []),
        )
        return Response(DisputeSerializer(dispute).data, status=status.HTTP_201_CREATED)
