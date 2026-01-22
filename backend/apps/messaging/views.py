"""Messaging views."""
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.response import Response

from apps.projects.models import Project

from .models import ProjectFile, ProjectMessage
from .serializers import ProjectFileSerializer, ProjectMessageSerializer


def _assert_project_member(user, project: Project):
    """Allow project owner, selected freelancer, or admin."""
    selected_freelancer_id = getattr(getattr(project, "selected_proposal", None), "freelancer_id", None)
    is_owner = project.owner_id == user.id
    is_freelancer = selected_freelancer_id == user.id
    is_admin = getattr(user, "role", None) == "admin"
    if not (is_owner or is_freelancer or is_admin):
        return False
    return True


class ProjectMessageListCreateView(generics.ListCreateAPIView):
    serializer_class = ProjectMessageSerializer

    def get_queryset(self):
        project = get_object_or_404(Project.objects.select_related("selected_proposal"), id=self.kwargs["project_id"])
        if not _assert_project_member(self.request.user, project):
            return ProjectMessage.objects.none()
        return ProjectMessage.objects.filter(project=project).select_related("sender")

    def perform_create(self, serializer):
        project = get_object_or_404(Project.objects.select_related("selected_proposal"), id=self.kwargs["project_id"])
        if not _assert_project_member(self.request.user, project):
            # DRF will convert to 403
            self.permission_denied(self.request, message="Only project members can post messages.")
        serializer.save(project=project, sender=self.request.user)

    def list(self, request, *args, **kwargs):
        project = get_object_or_404(Project.objects.select_related("selected_proposal"), id=kwargs["project_id"])
        if not _assert_project_member(request.user, project):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        return super().list(request, *args, **kwargs)


class ProjectFileUploadView(generics.CreateAPIView):
    serializer_class = ProjectFileSerializer

    def perform_create(self, serializer):
        project = get_object_or_404(Project.objects.select_related("selected_proposal"), id=self.kwargs["project_id"])
        if not _assert_project_member(self.request.user, project):
            self.permission_denied(self.request, message="Only project members can upload files.")
        upload = self.request.FILES.get("file")
        serializer.save(
            project=project,
            uploader=self.request.user,
            name=getattr(upload, "name", ""),
            size=getattr(upload, "size", 0),
        )

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        data = response.data
        return Response(
            {
                "file_id": data["id"],
                "url": data["file"],
                "name": data["name"],
                "size": data["size"],
            }
        )
