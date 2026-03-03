"""Serializers for authentication and user profile."""
from datetime import timedelta

from django.contrib.auth.hashers import check_password
from django.utils import timezone
from rest_framework import serializers

from .models import EmailOTP, User
from .services import create_email_otp


OTP_MAX_ATTEMPTS = 5
OTP_LOCKOUT_MINUTES = 15


class RequestOtpSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def create(self, validated_data):
        otp = create_email_otp(validated_data["email"])
        return {"otp_token": otp.otp_token}


class VerifyOtpSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    otp_token = serializers.CharField(max_length=64)

    def validate(self, attrs):
        try:
            obj = EmailOTP.objects.get(
                email=attrs["email"],
                otp_token=attrs["otp_token"],
                is_used=False,
            )
        except EmailOTP.DoesNotExist as exc:
            raise serializers.ValidationError("Invalid OTP token") from exc

        now = timezone.now()
        if obj.locked_until and obj.locked_until > now:
            raise serializers.ValidationError("Too many attempts. Try again later.")

        if obj.expires_at < timezone.now():
            raise serializers.ValidationError("OTP expired")

        if not check_password(attrs["otp"], obj.otp_hash):
            obj.failed_attempts += 1
            if obj.failed_attempts >= OTP_MAX_ATTEMPTS:
                obj.locked_until = now + timedelta(minutes=OTP_LOCKOUT_MINUTES)
            obj.save(update_fields=["failed_attempts", "locked_until"])
            raise serializers.ValidationError("OTP incorrect")

        attrs["otp_obj"] = obj
        return attrs

    def create(self, validated_data):
        obj: EmailOTP = validated_data["otp_obj"]
        obj.is_used = True
        obj.failed_attempts = 0
        obj.locked_until = None
        obj.save(update_fields=["is_used", "failed_attempts", "locked_until"])

        user, _ = User.objects.get_or_create(
            email=validated_data["email"],
            defaults={"role": User.ROLE_CLIENT},
        )
        user.is_active = True
        user.save(update_fields=["is_active"])
        return user


class MeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "role", "is_verified", "created_at"]


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "role", "is_verified", "created_at"]
