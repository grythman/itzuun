"""Profile serializers."""
from rest_framework import serializers

from .models import Profile


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ("id", "user", "full_name", "bio", "skills", "hourly_rate")
        read_only_fields = ("id", "user")
