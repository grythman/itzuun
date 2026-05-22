from rest_framework import serializers

from apps.accounts.models import User
from apps.payments.models import Dispute


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "role",
            "is_verified",
            "verification_status",
            "is_active",
            "is_staff",
            "created_at",
        )


class DisputeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dispute
        fields = (
            "id",
            "project",
            "raised_by",
            "reason",
            "resolved_by",
            "resolved_at",
            "created_at",
        )
