"""Profile serializers."""
from rest_framework import serializers

from .models import Profile


class ProfileSerializer(serializers.ModelSerializer):
    profile_completeness = serializers.IntegerField(read_only=True)
    verification_status = serializers.CharField(source="user.verification_status", read_only=True)
    avg_rating = serializers.FloatField(read_only=True, default=0.0)
    review_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Profile
        fields = (
            "id", "user", "full_name", "title", "bio", "skills", "hourly_rate",
            "portfolio", "is_available", "response_time_hours", "last_active",
            "profile_completeness", "verification_status", "avg_rating", "review_count"
        )
        read_only_fields = ("id", "user", "last_active", "profile_completeness", "verification_status", "avg_rating", "review_count")

    def validate_portfolio(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Portfolio must be a list.")
        if len(value) > 10:
            raise serializers.ValidationError("Portfolio can have at most 10 items.")
        for item in value:
            if not isinstance(item, dict):
                raise serializers.ValidationError("Each portfolio item must be an object.")
            if "title" not in item or not str(item["title"]).strip():
                raise serializers.ValidationError("Each portfolio item must have a title.")
        return value
