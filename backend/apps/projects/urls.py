from django.urls import path
from .views import (
    CategoryListView, ProjectCloseView, ProjectDetailView,
    ProjectDescriptionSuggestView, ProjectDeliverableCreateView,
    ProjectListCreateView, ProjectProposalListCreateView,
    ProjectSelectFreelancerView, ProposalDetailView,
    ProposalMeListView, ProposalWithdrawView,
)

urlpatterns = [
    path("projects/", ProjectListCreateView.as_view(), name="project-list"),
    path("projects", ProjectListCreateView.as_view()),
    path("projects/categories/", CategoryListView.as_view(), name="category-list"),
    path("projects/categories", CategoryListView.as_view()),
    path("projects/<int:pk>/", ProjectDetailView.as_view(), name="project-detail"),
    path("projects/<int:pk>", ProjectDetailView.as_view()),
    path("me/proposals/", ProposalMeListView.as_view(), name="proposal-me"),
    path("me/proposals", ProposalMeListView.as_view()),
]
