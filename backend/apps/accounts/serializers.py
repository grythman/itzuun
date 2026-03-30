"""Serializers for authentication and user profile."""
from datetime import timedelta
import re

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password
from django.utils import timezone
from rest_framework import serializers

from common.cache_utils import bump_admin_resource_version, bump_user_public_version
from .models import EmailOTP, User
from .services import create_email_otp, verify_google_credential


OTP_MAX_ATTEMPTS = 5
OTP_LOCKOUT_MINUTES = 15


class RequestOtpSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def create(self, validated_data):
        otp_record, otp_code = create_email_otp(validated_data["email"])
        payload = {"otp_token": otp_record.otp_token}
        if settings.DEBUG:
            payload["dev_otp"] = otp_code
        return payload


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

        user, created = User.objects.get_or_create(
            email=validated_data["email"],
            defaults={"role": User.ROLE_CLIENT},
        )
        was_active = user.is_active
        user.is_active = True
        user.save(update_fields=["is_active"])
        bump_user_public_version(user.id)
        if created or not was_active:
            bump_admin_resource_version("users")
        return user


class GoogleAuthSerializer(serializers.Serializer):
    credential = serializers.CharField()
    role = serializers.ChoiceField(choices=[User.ROLE_CLIENT, User.ROLE_FREELANCER], required=False)

    def validate(self, attrs):
        payload = verify_google_credential(attrs["credential"])
        attrs["google_email"] = User.objects.normalize_email(payload["email"])
        attrs["role"] = attrs.get("role", User.ROLE_CLIENT)
        return attrs

    def create(self, validated_data):
        user, created = User.objects.get_or_create(
            email=validated_data["google_email"],
            defaults={
                "role": validated_data["role"],
                "is_verified": True,
            },
        )

        update_fields: list[str] = []
        if not user.is_active:
            user.is_active = True
            update_fields.append("is_active")
        if not user.is_verified:
            user.is_verified = True
            update_fields.append("is_verified")
        if update_fields:
            user.save(update_fields=update_fields)

        bump_user_public_version(user.id)
        if created or update_fields:
            bump_admin_resource_version("users")
        return user


class MeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "email", "role", "is_verified", "created_at",
            "verification_status", "verification_type", "phone", "rejection_reason"
        ]
        read_only_fields = [
            "verification_status", "verification_type", "phone", "rejection_reason"
        ]


class VerificationSubmitSerializer(serializers.Serializer):
    verification_type = serializers.ChoiceField(choices=User.VERIFICATION_TYPE_CHOICES)
    phone = serializers.CharField(max_length=20)

    def validate_phone(self, value: str) -> str:
        cleaned = value.strip().replace(" ", "").replace("-", "")
        if cleaned.startswith("+"):
            digits = cleaned[1:]
        else:
            digits = cleaned
        if not re.fullmatch(r"\d{8,15}", digits):
            raise serializers.ValidationError("Phone must contain 8-15 digits (optionally starting with +).")
        normalized = f"+{digits}" if value.strip().startswith("+") else digits
        return normalized

    def validate(self, attrs):
        user = self.context["request"].user
        if user.verification_status == User.VERIFICATION_PENDING:
            raise serializers.ValidationError("Verification is already under review.")
        if user.verification_status == User.VERIFICATION_SUSPENDED:
            raise serializers.ValidationError("Account is suspended. Contact support before re-submitting verification.")
        return attrs

    def create(self, validated_data):
        user = self.context["request"].user
        user.verification_type = validated_data["verification_type"]
        user.phone = validated_data["phone"]
        user.verification_status = User.VERIFICATION_PENDING
        user.rejection_reason = ""
        user.is_verified = False
        user.save(update_fields=["verification_type", "phone", "verification_status", "rejection_reason", "is_verified"])
        bump_admin_resource_version("users")
        bump_user_public_version(user.id)
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "email", "role", "is_verified", "created_at",
            "verification_status", "verification_type", "phone", "rejection_reason", "is_active"
        ]


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8, max_length=128)
    role = serializers.ChoiceField(choices=[User.ROLE_CLIENT, User.ROLE_FREELANCER], required=False)

    def validate_email(self, value):
        normalized = User.objects.normalize_email(value)
        if User.objects.filter(email=normalized).exists():
            raise serializers.ValidationError("User with this email already exists")
        return normalized

    def create(self, validated_data):
        role = validated_data.get("role", User.ROLE_CLIENT)
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            role=role,
        )
        bump_user_public_version(user.id)
        bump_admin_resource_version("users")
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8, max_length=128)

    def validate(self, attrs):
        user = authenticate(username=attrs["email"], password=attrs["password"])
        if not user:
            raise serializers.ValidationError("Invalid credentials")
        if not user.is_active:
            raise serializers.ValidationError("User account is inactive")
        attrs["user"] = user
        return attrs
