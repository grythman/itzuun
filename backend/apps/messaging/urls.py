"""Messaging routes."""
from django.urls import path

from .views import ProjectFileUploadView, ProjectMessageListCreateView

urlpatterns = [
    path("projects/<int:project_id>/messages", ProjectMessageListCreateView.as_view(), name="project-messages"),
    path("projects/<int:project_id>/files", ProjectFileUploadView.as_view(), name="project-files"),
]
