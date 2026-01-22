"""Auth and user URL routes."""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import MeView, RequestOtpView, VerifyOtpView

urlpatterns = [
    path("request-otp", RequestOtpView.as_view(), name="request-otp"),
    path("verify-otp", VerifyOtpView.as_view(), name="verify-otp"),
    path("refresh", TokenRefreshView.as_view(), name="token-refresh"),
    path("me", MeView.as_view(), name="me"),
]
