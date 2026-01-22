"""Messaging views."""
from rest_framework import generics
from rest_framework.response import Response

from .models import ProjectFile, ProjectMessage
from .serializers import ProjectFileSerializer, ProjectMessageSerializer


class ProjectMessageListCreateView(generics.ListCreateAPIView):
    serializer_class = ProjectMessageSerializer

    def get_queryset(self):
        return ProjectMessage.objects.filter(project_id=self.kwargs["project_id"])

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs["project_id"], sender=self.request.user)


class ProjectFileUploadView(generics.CreateAPIView):
    serializer_class = ProjectFileSerializer

    def perform_create(self, serializer):
        upload = self.request.FILES.get("file")
        serializer.save(
            project_id=self.kwargs["project_id"],
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
