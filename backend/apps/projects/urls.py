from django.urls import re_path

from .views import (
    CategoryListView,
    ProjectConfirmCompletionView,
    ProjectDeliverableCreateView,
    ProjectDescriptionSuggestView,
    ProjectDetailView,
    ProjectListCreateView,
    ProjectProposalListCreateView,
    ProjectSelectFreelancerView,
    ProjectSubmitResultView,
    ProposalDetailView,
    ProposalMeListView,
    ProposalWithdrawView,
)

urlpatterns = [
    re_path(r"^projects/?$", ProjectListCreateView.as_view(), name="project-list"),
    re_path(
        r"^projects/categories/?$", CategoryListView.as_view(), name="category-list"
    ),
    re_path(
        r"^projects/ai-description-suggest/?$",
        ProjectDescriptionSuggestView.as_view(),
        name="project-ai-description-suggest",
    ),
    re_path(
        r"^projects/(?P<pk>\d+)/?$", ProjectDetailView.as_view(), name="project-detail"
    ),
    re_path(
        r"^projects/(?P<project_id>\d+)/proposals/?$",
        ProjectProposalListCreateView.as_view(),
        name="project-proposal-list",
    ),
    re_path(
        r"^projects/(?P<project_id>\d+)/select-freelancer/?$",
        ProjectSelectFreelancerView.as_view(),
        name="project-select-freelancer",
    ),
    re_path(
        r"^projects/(?P<project_id>\d+)/deliverables/?$",
        ProjectDeliverableCreateView.as_view(),
        name="project-deliverable-create",
    ),
    re_path(
        r"^projects/(?P<project_id>\d+)/submit-result/?$",
        ProjectSubmitResultView.as_view(),
        name="project-submit-result",
    ),
    re_path(
        r"^projects/(?P<project_id>\d+)/confirm-completion/?$",
        ProjectConfirmCompletionView.as_view(),
        name="project-confirm-completion",
    ),
    re_path(r"^me/proposals/?$", ProposalMeListView.as_view(), name="proposal-me"),
    re_path(
        r"^proposals/(?P<pk>\d+)/?$",
        ProposalDetailView.as_view(),
        name="proposal-detail",
    ),
    re_path(
        r"^proposals/(?P<proposal_id>\d+)/withdraw/?$",
        ProposalWithdrawView.as_view(),
        name="proposal-withdraw",
    ),
]
