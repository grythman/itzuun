"""Project routes."""
from django.urls import path

from .views import (
    ProjectCloseView,
    ProjectDetailView,
    ProjectListCreateView,
    ProjectProposalListCreateView,
    ProjectSelectFreelancerView,
    ProposalDetailView,
    ProposalMeListView,
    ProposalWithdrawView,
)

urlpatterns = [
    path("projects", ProjectListCreateView.as_view(), name="project-list"),
    path("projects/<int:pk>", ProjectDetailView.as_view(), name="project-detail"),
    path("projects/<int:project_id>/close", ProjectCloseView.as_view(), name="project-close"),
    path(
        "projects/<int:project_id>/select-freelancer",
        ProjectSelectFreelancerView.as_view(),
        name="project-select-freelancer",
    ),
    path(
        "projects/<int:project_id>/proposals",
        ProjectProposalListCreateView.as_view(),
        name="project-proposals",
    ),
    path("me/proposals", ProposalMeListView.as_view(), name="proposal-me"),
    path("proposals/<int:pk>", ProposalDetailView.as_view(), name="proposal-detail"),
    path("proposals/<int:proposal_id>/withdraw", ProposalWithdrawView.as_view(), name="proposal-withdraw"),
]
