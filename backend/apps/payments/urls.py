"""Escrow routes."""
from django.urls import path

from .views import (
    EscrowAdminApproveView,
    EscrowDepositView,
    EscrowReleaseView,
    PaymentCreateView,
    PaymentStatusView,
    PaymentWebhookView,
    ProjectConfirmCompletionView,
    ProjectDisputeView,
    ProjectSubmitResultView,
)

urlpatterns = [
    path("payments/create/", PaymentCreateView.as_view(), name="payment-create"),
    path("payments/webhook/", PaymentWebhookView.as_view(), name="payment-webhook"),
    path("payments/status/<int:project_id>", PaymentStatusView.as_view(), name="payment-status"),
    path("projects/<int:project_id>/escrow/deposit", EscrowDepositView.as_view(), name="escrow-deposit"),
    path("escrow/<int:escrow_id>/admin/approve", EscrowAdminApproveView.as_view(), name="escrow-approve"),
    path("escrow/<int:escrow_id>/release", EscrowReleaseView.as_view(), name="escrow-release"),
    path("projects/<int:project_id>/submit-result", ProjectSubmitResultView.as_view(), name="submit-result"),
    path(
        "projects/<int:project_id>/confirm-completion",
        ProjectConfirmCompletionView.as_view(),
        name="confirm-completion",
    ),
    path("projects/<int:project_id>/dispute", ProjectDisputeView.as_view(), name="project-dispute"),
]
