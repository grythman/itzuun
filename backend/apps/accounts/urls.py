"""Auth and user URL routes."""
from django.urls import path

from .views import CookieTokenRefreshView, LogoutView, MeView, RequestOtpView, VerifyOtpView

urlpatterns = [
    path("request-otp", RequestOtpView.as_view(), name="request-otp"),
    path("verify-otp", VerifyOtpView.as_view(), name="verify-otp"),
    path("refresh", CookieTokenRefreshView.as_view(), name="token-refresh"),
    path("logout", LogoutView.as_view(), name="logout"),
    path("me", MeView.as_view(), name="me"),
]
