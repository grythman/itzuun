"""Messaging views."""

from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.response import Response

from apps.projects.models import Project

from .models import ProjectFile, ProjectMessage
from .selectors import MessageSelector
from .serializers import ProjectFileSerializer, ProjectMessageSerializer
from .services import MessageService


def _assert_project_member(user, project: Project):
    """Allow project owner, selected freelancer, or admin."""
    selected_freelancer_id = getattr(
        getattr(project, "selected_proposal", None), "freelancer_id", None
    )
    is_owner = project.owner_id == user.id
    is_freelancer = selected_freelancer_id == user.id
    is_admin = getattr(user, "role", None) == "admin"
    if not (is_owner or is_freelancer or is_admin):
        return False
    return True


class ProjectMessageListCreateView(generics.ListCreateAPIView):
    serializer_class = ProjectMessageSerializer

    def get_queryset(self):
        project = get_object_or_404(
            Project.objects.select_related("selected_proposal"),
            id=self.kwargs["project_id"],
        )
        if not _assert_project_member(self.request.user, project):
            return ProjectMessage.objects.none()
        return MessageSelector.get_thread(project_id=project.id)

    def perform_create(self, serializer):
        project = get_object_or_404(
            Project.objects.select_related("selected_proposal"),
            id=self.kwargs["project_id"],
        )
        if not _assert_project_member(self.request.user, project):
            # DRF will convert to 403
            self.permission_denied(
                self.request, message="Only project members can post messages."
            )
        message = MessageService.send(
            project=project,
            sender=self.request.user,
            text=serializer.validated_data["text"],
        )
        serializer.instance = message

    def list(self, request, *args, **kwargs):
        project = get_object_or_404(
            Project.objects.select_related("selected_proposal"), id=kwargs["project_id"]
        )
        if not _assert_project_member(request.user, project):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        return super().list(request, *args, **kwargs)


class ProjectFileUploadView(generics.CreateAPIView):
    serializer_class = ProjectFileSerializer

    def perform_create(self, serializer):
        project = get_object_or_404(
            Project.objects.select_related("selected_proposal"),
            id=self.kwargs["project_id"],
        )
        if not _assert_project_member(self.request.user, project):
            self.permission_denied(
                self.request, message="Only project members can upload files."
            )
        upload = self.request.FILES.get("file")
        MessageService.attach_file(
            project=project,
            uploader=self.request.user,
            file=upload,
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


from django.db.models import Q
from rest_framework.views import APIView


class GlobalInboxView(APIView):
    """Returns a list of conversation threads for the user's active projects."""

    def get(self, request):
        user = request.user

        # Find projects where user is owner or hired freelancer
        projects = Project.objects.filter(
            Q(owner=user) | Q(selected_proposal__freelancer=user)
        ).distinct()

        threads = []
        for p in projects:
            latest_msg = p.messages.order_by("-created_at").first()
            if not latest_msg:
                continue

            is_client = p.owner_id == user.id
            other_user = (
                getattr(p.selected_proposal, "freelancer", None)
                if is_client
                else p.owner
            )

            threads.append(
                {
                    "id": p.id,
                    "project_title": p.title,
                    "name": (
                        getattr(other_user, "email", "Unknown")
                        if other_user
                        else "Unknown"
                    ),
                    "avatar": (
                        getattr(other_user, "email", "?")[0].upper()
                        if other_user
                        else "?"
                    ),
                    "role": "client" if is_client else "freelancer",
                    "lastMessage": latest_msg.text or (f"[{latest_msg.type}]"),
                    "time": (
                        latest_msg.created_at.strftime("%H:%M")
                        if latest_msg.created_at
                        else ""
                    ),
                    "created_at_dt": latest_msg.created_at,  # For sorting
                    "unread": 0,  # Simple for now
                }
            )

        threads.sort(key=lambda x: x["created_at_dt"], reverse=True)

        # Remove datetime obj before returning
        return_threads = [
            {k: v for k, v in t.items() if k != "created_at_dt"} for t in threads
        ]

        return Response(return_threads)
