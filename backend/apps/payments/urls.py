"""Escrow routes."""
from django.urls import re_path

from .views import (
    EscrowAdminApproveView,
    ProjectConfirmCompletionView,
    ProjectDisputeView,
    ProjectEscrowDepositView
)

urlpatterns = [
    # re_path(r"^payments/create/?$", PaymentCreateView.as_view(), name="payment-create"),
    # re_path(r"^payments/webhook/?$", PaymentWebhookView.as_view(), name="payment-webhook"),
    # re_path(r"^payments/status/(?P<project_id>\d+)/?$", PaymentStatusView.as_view(), name="payment-status"),
    re_path(r"^projects/(?P<project_id>\d+)/escrow/deposit/?$", ProjectEscrowDepositView.as_view(), name="escrow-deposit"),
    re_path(r"^escrow/(?P<escrow_id>\d+)/admin/approve/?$", EscrowAdminApproveView.as_view(), name="escrow-approve"),
    # re_path(r"^escrow/(?P<escrow_id>\d+)/release/?$", EscrowReleaseView.as_view(), name="escrow-release"),
    # re_path(r"^projects/(?P<project_id>\d+)/submit-result/?$", ProjectSubmitResultView.as_view(), name="submit-result"),
    re_path(r"^projects/(?P<project_id>\d+)/confirm-completion/?$", ProjectConfirmCompletionView.as_view(), name="confirm-completion"),
    re_path(r"^projects/(?P<project_id>\d+)/dispute/?$", ProjectDisputeView.as_view(), name="project-dispute"),
]
