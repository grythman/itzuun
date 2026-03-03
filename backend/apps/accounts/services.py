"""Domain services for OTP and auth flows."""
import random
import secrets
from datetime import timedelta

from django.contrib.auth.hashers import make_password
from django.utils import timezone

from .models import EmailOTP


def generate_otp() -> str:
    return f"{random.randint(0, 999999):06d}"


def create_email_otp(email: str) -> EmailOTP:
    otp = generate_otp()
    token = secrets.token_hex(32)

    EmailOTP.objects.filter(email=email, is_used=False).update(is_used=True)

    obj = EmailOTP.objects.create(
        email=email,
        otp_hash=make_password(otp),
        otp_token=token,
        expires_at=timezone.now() + timedelta(minutes=10),
    )
    return obj
