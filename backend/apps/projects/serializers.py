"""Project and proposal serializers."""
from rest_framework import serializers

from .models import Project, Proposal


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
