"""Auth and user URL routes."""
from django.urls import path

from .views import CookieTokenRefreshView, GoogleAuthView, LoginView, LogoutView, MeView, RegisterView, RequestOtpView, VerificationSubmitView, VerifyOtpView

urlpatterns = [
    path("register", RegisterView.as_view(), name="register"),
    path("login", LoginView.as_view(), name="login"),
    path("google", GoogleAuthView.as_view(), name="google"),
    path("request-otp", RequestOtpView.as_view(), name="request-otp"),
    path("verify-otp", VerifyOtpView.as_view(), name="verify-otp"),
    path("refresh", CookieTokenRefreshView.as_view(), name="token-refresh"),
    path("logout", LogoutView.as_view(), name="logout"),
    path("me", MeView.as_view(), name="me"),
    path("me/verification", VerificationSubmitView.as_view(), name="submit-verification"),
]
