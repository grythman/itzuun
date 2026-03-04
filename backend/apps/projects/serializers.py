"""Project and proposal serializers."""
from rest_framework import serializers

from .models import Project, ProjectDeliverable, Proposal


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = (
            "id",
            "owner",
            "title",
            "description",
            "budget",
            "timeline_days",
            "category",
            "status",
            "selected_proposal",
        )
        read_only_fields = ("id", "owner", "status", "selected_proposal")


class ProposalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proposal
        fields = ("id", "project", "freelancer", "price", "timeline_days", "message", "status")
        read_only_fields = ("id", "project", "freelancer", "status")


class ProjectDeliverableSerializer(serializers.ModelSerializer):
    file_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = ProjectDeliverable
        fields = ("id", "project", "file", "file_id", "submitted_by", "description", "checksum", "submitted_at")
        read_only_fields = ("id", "project", "file", "submitted_by", "submitted_at")


class ProjectDescriptionSuggestSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    category = serializers.CharField(max_length=64)
    budget = serializers.IntegerField(min_value=1)
    timeline_days = serializers.IntegerField(min_value=1)
    required_skills = serializers.ListField(
        child=serializers.CharField(max_length=64),
        required=False,
        allow_empty=True,
    )


class ProjectDescriptionSuggestResponseSerializer(serializers.Serializer):
    description = serializers.CharField()
