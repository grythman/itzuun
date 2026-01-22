"""Review serializers."""
from rest_framework import serializers

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    class Meta:
        model = Review
        fields = ("id", "project", "reviewer", "reviewee", "rating", "comment", "created_at")
        read_only_fields = ("id", "project", "reviewer", "reviewee", "created_at")
