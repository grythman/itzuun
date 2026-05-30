"""Domain services for OTP and auth flows."""

import logging
import random
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.core.mail import send_mail
from django.utils import timezone

from common.exceptions import DomainError

from .models import EmailOTP

logger = logging.getLogger(__name__)


def generate_otp() -> str:
    return f"{random.randint(0, 999999):06d}"


def _send_otp_email(email: str, otp: str) -> None:
    """Send OTP code to user via email."""
    try:
        send_mail(
            subject="ITZuun - Your login code",
            message=f"Your ITZuun verification code is: {otp}\n\nThis code expires in 10 minutes.\nDo not share it with anyone.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception:
        logger.exception("Failed to send OTP email to %s", email)


def create_email_otp(email: str) -> tuple[EmailOTP, str]:
    otp = generate_otp()
    token = secrets.token_hex(32)

    EmailOTP.objects.filter(email=email, is_used=False).update(is_used=True)

    obj = EmailOTP.objects.create(
        email=email,
        otp_hash=make_password(otp),
        otp_token=token,
        expires_at=timezone.now() + timedelta(minutes=10),
    )
    _send_otp_email(email, otp)
    return obj, otp


def verify_google_credential(credential: str) -> dict:
    if not settings.GOOGLE_CLIENT_ID:
        raise DomainError("Google auth is not configured")

    try:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token

        request = google_requests.Request()
        payload = id_token.verify_oauth2_token(
            credential,
            request,
            settings.GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=10,
        )
    except ValueError as exc:
        raise DomainError("Google credential is invalid") from exc
    except Exception as exc:
        logger.exception("Google token verification failed")
        raise DomainError("Unable to verify Google credential") from exc

    if payload.get("email_verified") not in {"true", True}:
        raise DomainError("Google email is not verified")

    email = payload.get("email")
    if not email:
        raise DomainError("Google account email is missing")

    return payload
