"""Auth and user URL routes."""
from django.urls import re_path
from .views import (
    CookieTokenRefreshView, GoogleAuthView, LoginView, LogoutView, 
    MeView, RegisterView, RequestOtpView, VerificationSubmitView, VerifyOtpView
)

# re_path ашиглан төгсгөлийн / тэмдэгтийг сонголттой (optional) болгов
# Ингэснээр /login болон /login/ хоёулаа ажиллана.
urlpatterns = [
    re_path(r"^register/?$", RegisterView.as_view(), name="register"),
    re_path(r"^login/?$", LoginView.as_view(), name="login"),
    re_path(r"^google/?$", GoogleAuthView.as_view(), name="google"),
    re_path(r"^request-otp/?$", RequestOtpView.as_view(), name="request-otp"),
    re_path(r"^verify-otp/?$", VerifyOtpView.as_view(), name="verify-otp"),
    re_path(r"^refresh/?$", CookieTokenRefreshView.as_view(), name="token-refresh"),
    re_path(r"^logout/?$", LogoutView.as_view(), name="logout"),
    re_path(r"^me/?$", MeView.as_view(), name="me"),
    re_path(r"^me/verification/?$", VerificationSubmitView.as_view(), name="submit-verification"),
]
