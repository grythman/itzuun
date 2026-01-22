"""Messaging models."""
from django.conf import settings
from django.db import models

from apps.projects.models import Project


class ProjectMessage(models.Model):
    TYPE_TEXT = "text"
    TYPE_FILE = "file"
    TYPE_CHOICES = ((TYPE_TEXT, "Text"), (TYPE_FILE, "File"))

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="messages")
    type = models.CharField(max_length=16, choices=TYPE_CHOICES, default=TYPE_TEXT)
    text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class ProjectFile(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="files")
    uploader = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="files")
    file = models.FileField(upload_to="project_files/")
    name = models.CharField(max_length=255)
    size = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
