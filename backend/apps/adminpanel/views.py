"""Admin panel API views."""
from django.core.cache import cache
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.accounts.permissions import IsAdminUser
from apps.accounts.serializers import UserSerializer
from apps.payments.models import Dispute, Escrow, Payment
from apps.payments.idempotency import execute_idempotent
from apps.payments.serializers import DisputeSerializer, EscrowSerializer, PaymentSerializer
from apps.projects.models import Project
from apps.projects.serializers import ProjectSerializer
from common.cache_utils import admin_detail_cache_key, admin_list_cache_key, bump_admin_resource_version, bump_user_public_version
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
        cache_key = admin_list_cache_key("users", request.query_params)
        cached_payload = cache.get(cache_key)
        if cached_payload is not None:
            return Response(cached_payload)

        verified = request.query_params.get("verified")
        queryset = User.objects.all().order_by("-created_at")
        if verified is not None:
            queryset = queryset.filter(is_verified=verified.lower() == "true")
        response = _paginated_response(request, queryset, UserSerializer, self)
        cache.set(cache_key, response.data, timeout=60)
        return response


class AdminUserVerifyView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        verify_user(user)
        bump_user_public_version(user.id)
        bump_admin_resource_version("users")
        return Response(UserSerializer(user).data)


class AdminProjectListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        cache_key = admin_list_cache_key("projects", request.query_params)
        cached_payload = cache.get(cache_key)
        if cached_payload is not None:
            return Response(cached_payload)

        status_param = request.query_params.get("status")
        queryset = Project.objects.all().order_by("-created_at")
        if status_param:
            queryset = queryset.filter(status=status_param)
        response = _paginated_response(request, queryset, ProjectSerializer, self)
        cache.set(cache_key, response.data, timeout=60)
        return response


class AdminEscrowListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        cache_key = admin_list_cache_key("escrow", request.query_params)
        cached_payload = cache.get(cache_key)
        if cached_payload is not None:
            return Response(cached_payload)

        status_param = request.query_params.get("status")
        queryset = Escrow.objects.select_related("project").all().order_by("-created_at")
        if status_param:
            queryset = queryset.filter(status=status_param)
        response = _paginated_response(request, queryset, EscrowSerializer, self)
        cache.set(cache_key, response.data, timeout=60)
        return response


class AdminPaymentListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        cache_key = admin_list_cache_key("payments", request.query_params)
        cached_payload = cache.get(cache_key)
        if cached_payload is not None:
            return Response(cached_payload)

        status_param = request.query_params.get("status")
        queryset = Payment.objects.select_related("project").all().order_by("-created_at")
        if status_param:
            queryset = queryset.filter(status=status_param)
        response = _paginated_response(request, queryset, PaymentSerializer, self)
        cache.set(cache_key, response.data, timeout=60)
        return response


class AdminDisputeListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        cache_key = admin_list_cache_key("disputes", request.query_params)
        cached_payload = cache.get(cache_key)
        if cached_payload is not None:
            return Response(cached_payload)

        unresolved = request.query_params.get("unresolved")
        queryset = Dispute.objects.select_related("project", "raised_by", "resolved_by").all().order_by("-created_at")
        if unresolved is not None and unresolved.lower() == "true":
            queryset = queryset.filter(resolved_at__isnull=True)
        response = _paginated_response(request, queryset, DisputeSerializer, self)
        cache.set(cache_key, response.data, timeout=60)
        return response


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
            bump_admin_resource_version("disputes")
            bump_admin_resource_version("escrow")
            bump_admin_resource_version("projects")
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
            bump_admin_resource_version("settings")
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
        cache_key = admin_detail_cache_key("settings")
        cached_payload = cache.get(cache_key)
        if cached_payload is not None:
            return Response(cached_payload)

        setting = PlatformSetting.get_solo()
        payload = {"platform_fee_pct": setting.platform_fee_pct}
        cache.set(cache_key, payload, timeout=300)
        return Response(payload)
