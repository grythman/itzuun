"""Project and proposal views."""
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Project, Proposal
from .permissions import IsClient, IsFreelancer
from .serializers import ProjectSerializer, ProposalSerializer
from .services import close_project, select_freelancer


class ProjectListCreateView(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer

    def get_queryset(self):
        queryset = Project.objects.all()
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
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class ProjectDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = ProjectSerializer
    queryset = Project.objects.all()

    def patch(self, request, *args, **kwargs):
        project = self.get_object()
        if project.owner_id != request.user.id:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        if project.status != Project.STATUS_OPEN:
            return Response({"detail": "Project is not open"}, status=status.HTTP_400_BAD_REQUEST)
        return super().patch(request, *args, **kwargs)


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
        return Proposal.objects.filter(project_id=self.kwargs["project_id"])

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


class ProposalMeListView(generics.ListAPIView):
    serializer_class = ProposalSerializer
    permission_classes = [IsFreelancer]

    def get_queryset(self):
        return Proposal.objects.filter(freelancer=self.request.user)


class ProposalDetailView(generics.UpdateAPIView):
    serializer_class = ProposalSerializer
    queryset = Proposal.objects.all()
    permission_classes = [IsFreelancer]

    def patch(self, request, *args, **kwargs):
        proposal = self.get_object()
        if proposal.freelancer_id != request.user.id:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        if proposal.status != Proposal.STATUS_PENDING:
            return Response({"detail": "Proposal is not pending"}, status=status.HTTP_400_BAD_REQUEST)
        return super().patch(request, *args, **kwargs)


class ProposalWithdrawView(APIView):
    permission_classes = [IsFreelancer]

    def post(self, request, proposal_id):
        proposal = get_object_or_404(Proposal, id=proposal_id, freelancer=request.user)
        proposal.status = Proposal.STATUS_WITHDRAWN
        proposal.save(update_fields=["status"])
        return Response({"status": proposal.status})
