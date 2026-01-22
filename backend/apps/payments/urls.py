"""Escrow routes."""
from django.urls import path

from .views import (
    EscrowAdminApproveView,
    EscrowDepositView,
    ProjectConfirmCompletionView,
    ProjectDisputeView,
    ProjectSubmitResultView,
)

urlpatterns = [
    path("projects/<int:project_id>/escrow/deposit", EscrowDepositView.as_view(), name="escrow-deposit"),
    path("escrow/<int:escrow_id>/admin/approve", EscrowAdminApproveView.as_view(), name="escrow-approve"),
    path("projects/<int:project_id>/submit-result", ProjectSubmitResultView.as_view(), name="submit-result"),
    path(
        "projects/<int:project_id>/confirm-completion",
        ProjectConfirmCompletionView.as_view(),
        name="confirm-completion",
    ),
    path("projects/<int:project_id>/dispute", ProjectDisputeView.as_view(), name="project-dispute"),
]
