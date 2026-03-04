"""Escrow and dispute views."""
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminUser
from apps.projects.models import Project
from apps.projects.permissions import IsClient, IsFreelancer

from .models import Dispute, Escrow
from .idempotency import execute_idempotent
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
