"""Project and proposal serializers."""

from rest_framework import serializers

from .models import Category, Project, ProjectDeliverable, Proposal


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name_en", "name_mn", "slug", "icon")


class ProjectSerializer(serializers.ModelSerializer):
    category_obj = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source="category_obj",
        write_only=True,
        required=False,
        allow_null=True,
    )
    required_skills = serializers.ListField(
        child=serializers.CharField(max_length=64),
        default=list,
    )

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
            "category_id",
            "category_obj",
            "required_skills",
            "status",
            "selected_proposal",
        )
        read_only_fields = ("id", "owner", "status", "selected_proposal")


class ProjectPrivateSerializer(ProjectSerializer):
    class Meta(ProjectSerializer.Meta):
        fields = ProjectSerializer.Meta.fields + ("contact_info",)


class ProposalSerializer(serializers.ModelSerializer):
    freelancer_verification_status = serializers.CharField(
        source="freelancer.verification_status", read_only=True
    )
    freelancer_is_verified = serializers.BooleanField(
        source="freelancer.is_verified", read_only=True
    )

    class Meta:
        model = Proposal
        fields = (
            "id",
            "project",
            "freelancer",
            "freelancer_verification_status",
            "freelancer_is_verified",
            "price",
            "timeline_days",
            "message",
            "status",
        )
        read_only_fields = ("id", "project", "freelancer", "status")


class ProjectDeliverableSerializer(serializers.ModelSerializer):
    file_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = ProjectDeliverable
        fields = (
            "id",
            "project",
            "file",
            "file_id",
            "submitted_by",
            "description",
            "checksum",
            "submitted_at",
        )
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
