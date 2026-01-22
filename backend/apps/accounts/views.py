"""Views for OTP-based auth and user endpoints."""
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import MeSerializer, RequestOtpSerializer, VerifyOtpSerializer


class RequestOtpView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RequestOtpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.save()
        return Response(data, status=status.HTTP_200_OK)


class VerifyOtpView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VerifyOtpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": MeSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class MeView(APIView):
    def get(self, request):
        return Response(MeSerializer(request.user).data)

    def patch(self, request):
        role = request.data.get("role")
        if role not in [User.ROLE_CLIENT, User.ROLE_FREELANCER]:
            return Response({"detail": "Invalid role"}, status=status.HTTP_400_BAD_REQUEST)
        request.user.role = role
        request.user.save(update_fields=["role"])
        return Response(MeSerializer(request.user).data)
