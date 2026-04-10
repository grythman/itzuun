"""Views for OTP-based auth and user endpoints."""
from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from common.cache_utils import bump_admin_resource_version, bump_user_public_version

from .models import User
from .serializers import GoogleAuthSerializer, LoginSerializer, MeSerializer, RegisterSerializer, RequestOtpSerializer, VerificationSubmitSerializer, VerifyOtpSerializer


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
    response.delete_cookie("access_token", path="/", samesite="Lax")
    response.delete_cookie("refresh_token", path="/", samesite="Lax")


class RequestOtpView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RequestOtpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.save()
        return Response(data, status=status.HTTP_200_OK)


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        response = Response(
            {
                "authenticated": True,
                "user": MeSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )
        _set_auth_cookies(response, str(refresh.access_token), str(refresh))
        return response


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

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


class GoogleAuthView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
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
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response(None, status=status.HTTP_200_OK)
        return Response(MeSerializer(request.user).data)

    def patch(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)
        role = request.data.get("role")
        if role not in [User.ROLE_CLIENT, User.ROLE_FREELANCER]:
            return Response({"detail": "Invalid role"}, status=status.HTTP_400_BAD_REQUEST)
        request.user.role = role
        request.user.save(update_fields=["role"])
        bump_user_public_version(request.user.id)
        bump_admin_resource_version("users")
        return Response(MeSerializer(request.user).data)


class VerificationSubmitView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = VerificationSubmitSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(MeSerializer(user).data, status=status.HTTP_200_OK)


class PremiumMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        is_active = bool(user.is_premium and (not user.premium_expiry or user.premium_expiry > timezone.now()))
        tier = "premium_freelancer" if is_active else "free"
        proposal_limit = 50 if is_active else 10
        return Response(
            {
                "tier": tier,
                "is_premium": is_active,
                "premium_plan_type": user.premium_plan_type,
                "premium_expiry": user.premium_expiry,
                "proposal_limit_monthly": proposal_limit,
            },
            status=status.HTTP_200_OK,
        )


class PremiumSubscribeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role != User.ROLE_FREELANCER:
            return Response({"detail": "Premium subscription is only available for freelancers."}, status=status.HTTP_400_BAD_REQUEST)

        plan_type = request.data.get("plan_type") or "pro_monthly"
        now = timezone.now()
        user.is_premium = True
        user.premium_plan_type = str(plan_type)
        user.premium_expiry = now + timedelta(days=30)
        user.save(update_fields=["is_premium", "premium_plan_type", "premium_expiry"])
        bump_user_public_version(user.id)
        bump_admin_resource_version("users")
        return Response(
            {
                "subscribed": True,
                "tier": "premium_freelancer",
                "premium_plan_type": user.premium_plan_type,
                "premium_expiry": user.premium_expiry,
            },
            status=status.HTTP_200_OK,
        )


class PremiumCancelView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        user.is_premium = False
        user.premium_plan_type = ""
        user.premium_expiry = None
        user.save(update_fields=["is_premium", "premium_plan_type", "premium_expiry"])
        bump_user_public_version(user.id)
        bump_admin_resource_version("users")
        return Response({"canceled": True, "tier": "free"}, status=status.HTTP_200_OK)
