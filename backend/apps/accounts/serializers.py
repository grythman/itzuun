"""Serializers for authentication and user profile."""
from django.utils import timezone
from rest_framework import serializers

from .models import EmailOTP, User
from .services import create_email_otp


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

        if obj.expires_at < timezone.now():
            raise serializers.ValidationError("OTP expired")
        if obj.otp_code != attrs["otp"]:
            raise serializers.ValidationError("OTP incorrect")
        attrs["otp_obj"] = obj
        return attrs

    def create(self, validated_data):
        obj: EmailOTP = validated_data["otp_obj"]
        obj.is_used = True
        obj.save(update_fields=["is_used"])

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
