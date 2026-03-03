"""Messaging serializers."""
from rest_framework import serializers

from .models import ProjectFile, ProjectMessage


MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "text/plain",
    "application/zip",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


class ProjectMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectMessage
        fields = ("id", "project", "sender", "type", "text", "created_at")
        read_only_fields = ("id", "project", "sender", "created_at")


class ProjectFileSerializer(serializers.ModelSerializer):
    def validate_file(self, value):
        if value.size > MAX_FILE_SIZE:
            raise serializers.ValidationError("File size must be less than 10MB.")

        content_type = getattr(value, "content_type", "")
        if content_type not in ALLOWED_MIME_TYPES:
            raise serializers.ValidationError("File type is not allowed.")
        return value

    class Meta:
        model = ProjectFile
        fields = ("id", "project", "uploader", "file", "name", "size", "created_at")
        read_only_fields = ("id", "project", "uploader", "created_at")
