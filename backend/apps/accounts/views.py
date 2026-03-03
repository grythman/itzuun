"""Views for OTP-based auth and user endpoints."""
from django.conf import settings
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from .models import User
from .serializers import MeSerializer, RequestOtpSerializer, VerifyOtpSerializer


def _set_auth_cookies(response: Response, access: str, refresh: str) -> None:
    access_seconds = int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds())
    refresh_seconds = int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds())
    secure = not settings.DEBUG

    response.set_cookie(
        "access_token",
        access,
        max_age=access_seconds,
        path="/",
        httponly=True,
        secure=secure,
        samesite="Lax",
    )
    response.set_cookie(
        "refresh_token",
        refresh,
        max_age=refresh_seconds,
        path="/",
        httponly=True,
        secure=secure,
        samesite="Lax",
    )


def _clear_auth_cookies(response: Response) -> None:
    secure = not settings.DEBUG
    response.delete_cookie("access_token", path="/", secure=secure, samesite="Lax")
    response.delete_cookie("refresh_token", path="/", secure=secure, samesite="Lax")


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
        response = Response(
            {
                "authenticated": True,
                "user": MeSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )
        _set_auth_cookies(response, str(refresh.access_token), str(refresh))
        return response


class CookieTokenRefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get("refresh_token")
        if not refresh_token:
            return Response({"detail": "Refresh token missing"}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = self.get_serializer(data={"refresh": refresh_token})
        serializer.is_valid(raise_exception=True)
        access = serializer.validated_data.get("access")
        refresh = serializer.validated_data.get("refresh", refresh_token)

        response = Response({"refreshed": True}, status=status.HTTP_200_OK)
        _set_auth_cookies(response, access, refresh)
        return response


class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        response = Response({"logged_out": True}, status=status.HTTP_200_OK)
        _clear_auth_cookies(response)
        return response


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
