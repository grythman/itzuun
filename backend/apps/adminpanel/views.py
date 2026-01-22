"""Admin panel API views."""
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.accounts.serializers import UserSerializer
from apps.payments.models import Dispute
from apps.payments.serializers import DisputeSerializer
from apps.projects.models import Project
from apps.projects.serializers import ProjectSerializer
from backend.common.models import PlatformSetting

from .services import resolve_project_dispute, update_platform_fee, verify_user


class AdminUserListView(APIView):
    def get(self, request):
        verified = request.query_params.get("verified")
        queryset = User.objects.all()
        if verified is not None:
            queryset = queryset.filter(is_verified=verified.lower() == "true")
        return Response(UserSerializer(queryset, many=True).data)


class AdminUserVerifyView(APIView):
    def post(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        verify_user(user)
        return Response(UserSerializer(user).data)


class AdminProjectListView(APIView):
    def get(self, request):
        status_param = request.query_params.get("status")
        queryset = Project.objects.all()
        if status_param:
            queryset = queryset.filter(status=status_param)
        return Response(ProjectSerializer(queryset, many=True).data)


class AdminDisputeResolveView(APIView):
    def post(self, request, dispute_id):
        dispute = get_object_or_404(Dispute, id=dispute_id)
        resolved = resolve_project_dispute(
            dispute,
            action=request.data.get("action"),
            release_amount=int(request.data.get("release_amount", 0)),
            refund_amount=int(request.data.get("refund_amount", 0)),
            note=request.data.get("note", ""),
            resolver=request.user,
        )
        return Response(DisputeSerializer(resolved).data)


class AdminCommissionUpdateView(APIView):
    def patch(self, request):
        setting = update_platform_fee(int(request.data.get("platform_fee_pct", 12)))
        return Response({"platform_fee_pct": setting.platform_fee_pct}, status=status.HTTP_200_OK)


class AdminCommissionDetailView(APIView):
    def get(self, request):
        setting = PlatformSetting.get_solo()
        return Response({"platform_fee_pct": setting.platform_fee_pct})
