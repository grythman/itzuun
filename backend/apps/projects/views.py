"""Project and proposal views."""
from django.db.models import Q
from django.core.cache import cache
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.messaging.models import ProjectFile
from common.cache_utils import bump_admin_resource_version, bump_project_version, project_detail_cache_key, project_list_cache_key

from .models import Project, ProjectDeliverable, Proposal
from .permissions import IsClient, IsFreelancer
from .serializers import (
    ProjectDeliverableSerializer,
    ProjectDescriptionSuggestResponseSerializer,
    ProjectDescriptionSuggestSerializer,
    ProjectSerializer,
    ProposalSerializer,
)
from .services import close_project, select_freelancer, suggest_project_description


class ProjectListCreateView(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer

    def get_queryset(self):
        queryset = (
            Project.objects.select_related("owner", "selected_proposal__freelancer")
            .prefetch_related("proposals")
            .all()
            .order_by("-created_at")
        )
        status_filter = self.request.query_params.get("status")
        category_filter = self.request.query_params.get("category")
        search = self.request.query_params.get("search")
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if category_filter:
            queryset = queryset.filter(category=category_filter)
        if search:
            queryset = queryset.filter(Q(title__icontains=search) | Q(description__icontains=search))
        return queryset

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsClient()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        project = serializer.save(owner=self.request.user)
        bump_project_version(project.id)
        bump_admin_resource_version("projects")

    def list(self, request, *args, **kwargs):
        cache_key = project_list_cache_key(request.query_params)
        cached_payload = cache.get(cache_key)
        if cached_payload is not None:
            return Response(cached_payload)

        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, timeout=60)
        return response


class ProjectDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = ProjectSerializer
    queryset = Project.objects.select_related("owner", "selected_proposal__freelancer").prefetch_related("proposals")

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return super().get_permissions()

    def patch(self, request, *args, **kwargs):
        project = self.get_object()
        if project.owner_id != request.user.id:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        if project.status != Project.STATUS_OPEN:
            return Response({"detail": "Project is not open"}, status=status.HTTP_400_BAD_REQUEST)
        response = super().patch(request, *args, **kwargs)
        bump_project_version(project.id)
        bump_admin_resource_version("projects")
        return response

    def retrieve(self, request, *args, **kwargs):
        project_id = kwargs["pk"]
        cache_key = project_detail_cache_key(project_id)
        cached_payload = cache.get(cache_key)
        if cached_payload is not None:
            return Response(cached_payload)

        response = super().retrieve(request, *args, **kwargs)
        cache.set(cache_key, response.data, timeout=60)
        return response


class ProjectCloseView(APIView):
    permission_classes = [IsClient]

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, owner=request.user)
        close_project(project)
        return Response({"status": project.status})


class ProjectSelectFreelancerView(APIView):
    permission_classes = [IsClient]

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, owner=request.user)
        proposal = get_object_or_404(Proposal, id=request.data.get("proposal_id"), project=project)
        select_freelancer(project, proposal)
        return Response(ProjectSerializer(project).data)


class ProjectProposalListCreateView(generics.ListCreateAPIView):
    serializer_class = ProposalSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsFreelancer()]
        return super().get_permissions()

    def get_queryset(self):
        return Proposal.objects.filter(project_id=self.kwargs["project_id"]).order_by("-created_at")

    def list(self, request, *args, **kwargs):
        project = get_object_or_404(Project, id=kwargs["project_id"])
        if request.user.role != "admin" and project.owner_id != request.user.id:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        return super().list(request, *args, **kwargs)

    def perform_create(self, serializer):
        project = get_object_or_404(Project, id=self.kwargs["project_id"])
        if project.status != Project.STATUS_OPEN:
            raise ValidationError({"detail": "Project is not open"})
        serializer.save(project=project, freelancer=self.request.user)
        bump_project_version(project.id)
        bump_admin_resource_version("projects")


class ProposalMeListView(generics.ListAPIView):
    serializer_class = ProposalSerializer
    permission_classes = [IsFreelancer]

    def get_queryset(self):
        return Proposal.objects.filter(freelancer=self.request.user).order_by("-created_at")


class ProposalDetailView(generics.UpdateAPIView):
    serializer_class = ProposalSerializer
    queryset = Proposal.objects.all().order_by("-created_at")
    permission_classes = [IsFreelancer]

    def patch(self, request, *args, **kwargs):
        proposal = self.get_object()
        if proposal.freelancer_id != request.user.id:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        if proposal.status != Proposal.STATUS_PENDING:
            return Response({"detail": "Proposal is not pending"}, status=status.HTTP_400_BAD_REQUEST)
        response = super().patch(request, *args, **kwargs)
        bump_project_version(proposal.project_id)
        bump_admin_resource_version("projects")
        return response


class ProposalWithdrawView(APIView):
    permission_classes = [IsFreelancer]

    def post(self, request, proposal_id):
        proposal = get_object_or_404(Proposal, id=proposal_id, freelancer=request.user)
        proposal.status = Proposal.STATUS_WITHDRAWN
        proposal.save(update_fields=["status"])
        bump_project_version(proposal.project_id)
        bump_admin_resource_version("projects")
        return Response({"status": proposal.status})


class ProjectDeliverableCreateView(APIView):
    permission_classes = [IsFreelancer]

    def post(self, request, project_id):
        project = get_object_or_404(Project.objects.select_related("selected_proposal"), id=project_id)
        selected_freelancer_id = getattr(getattr(project, "selected_proposal", None), "freelancer_id", None)
        if selected_freelancer_id != request.user.id:
            return Response({"detail": "Only selected freelancer can submit deliverables"}, status=status.HTTP_403_FORBIDDEN)

        file_id = request.data.get("file_id")
        if not file_id:
            raise ValidationError({"file_id": "This field is required"})
        file_obj = get_object_or_404(ProjectFile, id=file_id, project=project, uploader=request.user)

        serializer = ProjectDeliverableSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        deliverable = ProjectDeliverable.objects.create(
            project=project,
            file=file_obj,
            submitted_by=request.user,
            description=serializer.validated_data.get("description", ""),
            checksum=serializer.validated_data["checksum"],
        )
        bump_project_version(project.id)
        bump_admin_resource_version("projects")
        return Response(ProjectDeliverableSerializer(deliverable).data, status=status.HTTP_201_CREATED)


class ProjectDescriptionSuggestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ProjectDescriptionSuggestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        description = suggest_project_description(
            title=data["title"],
            category=data["category"],
            budget=data["budget"],
            timeline_days=data["timeline_days"],
            required_skills=data.get("required_skills", []),
        )
        response = ProjectDescriptionSuggestResponseSerializer({"description": description})
        return Response(response.data, status=status.HTTP_200_OK)
