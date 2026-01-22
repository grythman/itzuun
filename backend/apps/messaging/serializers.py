"""Messaging serializers."""
from rest_framework import serializers

from .models import ProjectFile, ProjectMessage


class ProjectMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectMessage
        fields = ("id", "project", "sender", "type", "text", "created_at")
        read_only_fields = ("id", "project", "sender", "created_at")


class ProjectFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectFile
        fields = ("id", "project", "uploader", "file", "name", "size", "created_at")
        read_only_fields = ("id", "project", "uploader", "created_at")
