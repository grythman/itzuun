"""Admin panel API views."""
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.accounts.permissions import IsAdminUser
from apps.accounts.serializers import UserSerializer
from apps.payments.models import Dispute, Escrow
from apps.payments.idempotency import execute_idempotent
from apps.payments.serializers import DisputeSerializer, EscrowSerializer
from apps.projects.models import Project
from apps.projects.serializers import ProjectSerializer
from common.pagination import StandardResultsSetPagination
from common.models import PlatformSetting

from .services import resolve_project_dispute, update_platform_fee, verify_user


def _paginated_response(request, queryset, serializer_class, view):
    paginator = StandardResultsSetPagination()
    page = paginator.paginate_queryset(queryset, request, view=view)
    serializer = serializer_class(page, many=True)
    return paginator.get_paginated_response(serializer.data)


class AdminUserListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        verified = request.query_params.get("verified")
        queryset = User.objects.all().order_by("-created_at")
        if verified is not None:
            queryset = queryset.filter(is_verified=verified.lower() == "true")
        return _paginated_response(request, queryset, UserSerializer, self)


class AdminUserVerifyView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        verify_user(user)
        return Response(UserSerializer(user).data)


class AdminProjectListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        status_param = request.query_params.get("status")
        queryset = Project.objects.all().order_by("-created_at")
        if status_param:
            queryset = queryset.filter(status=status_param)
        return _paginated_response(request, queryset, ProjectSerializer, self)


class AdminEscrowListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        status_param = request.query_params.get("status")
        queryset = Escrow.objects.select_related("project").all().order_by("-created_at")
        if status_param:
            queryset = queryset.filter(status=status_param)
        return _paginated_response(request, queryset, EscrowSerializer, self)


class AdminDisputeListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        unresolved = request.query_params.get("unresolved")
        queryset = Dispute.objects.select_related("project", "raised_by", "resolved_by").all().order_by("-created_at")
        if unresolved is not None and unresolved.lower() == "true":
            queryset = queryset.filter(resolved_at__isnull=True)
        return _paginated_response(request, queryset, DisputeSerializer, self)


class AdminDisputeResolveView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, dispute_id):
        dispute = get_object_or_404(Dispute, id=dispute_id)

        def _executor():
            resolved = resolve_project_dispute(
                dispute,
                action=request.data.get("action"),
                release_amount=int(request.data.get("release_amount", 0)),
                refund_amount=int(request.data.get("refund_amount", 0)),
                note=request.data.get("note", ""),
                resolver=request.user,
            )
            return DisputeSerializer(resolved).data, status.HTTP_200_OK

        payload, status_code = execute_idempotent(
            request,
            endpoint=f"POST:/api/v1/admin/disputes/{dispute_id}/resolve",
            actor=request.user,
            executor=_executor,
        )
        return Response(payload, status=status_code)


class AdminCommissionUpdateView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request):

        def _executor():
            setting = update_platform_fee(int(request.data.get("platform_fee_pct", 12)), actor=request.user)
            return {"platform_fee_pct": setting.platform_fee_pct}, status.HTTP_200_OK

        payload, status_code = execute_idempotent(
            request,
            endpoint="PATCH:/api/v1/admin/settings/commission",
            actor=request.user,
            executor=_executor,
        )
        return Response(payload, status=status_code)


class AdminCommissionDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        setting = PlatformSetting.get_solo()
        return Response({"platform_fee_pct": setting.platform_fee_pct})
