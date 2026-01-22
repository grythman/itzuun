"""Domain services for OTP and auth flows."""
import random
import secrets
from datetime import timedelta

from django.utils import timezone

from .models import EmailOTP


def generate_otp() -> str:
    return f"{random.randint(0, 999999):06d}"


def create_email_otp(email: str) -> EmailOTP:
    otp = generate_otp()
    token = secrets.token_hex(32)
    obj = EmailOTP.objects.create(
        email=email,
        otp_code=otp,
        otp_token=token,
        expires_at=timezone.now() + timedelta(minutes=10),
    )
    print(f"[DEV OTP] email={email} otp={otp}")
    return obj
