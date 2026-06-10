"""Admin panel routes."""

from django.urls import path

from .views import (
    AdminAuditLogListView,
    AdminCommissionDetailView,
    AdminCommissionUpdateView,
    AdminDisputeListView,
    AdminDisputeResolveView,
    AdminEscrowListView,
    AdminLedgerListView,
    AdminPaymentListView,
    AdminProjectListView,
    AdminProjectTransitionView,
    AdminUserListView,
    AdminUserUnsuspendView,
    AdminUserVerifyView,
)

urlpatterns = [
    path("users", AdminUserListView.as_view(), name="admin-users"),
    path(
        "users/<int:user_id>/verify",
        AdminUserVerifyView.as_view(),
        name="admin-users-verify",
    ),
    path(
        "users/<int:user_id>/unsuspend",
        AdminUserUnsuspendView.as_view(),
        name="admin-users-unsuspend",
    ),
    path("projects", AdminProjectListView.as_view(), name="admin-projects"),
    path(
        "projects/<int:project_id>/transition",
        AdminProjectTransitionView.as_view(),
        name="admin-project-transition",
    ),
    path("escrow", AdminEscrowListView.as_view(), name="admin-escrow"),
    path("ledger", AdminLedgerListView.as_view(), name="admin-ledger"),
    path("audit-logs", AdminAuditLogListView.as_view(), name="admin-audit-logs"),
    path("payments", AdminPaymentListView.as_view(), name="admin-payments"),
    path("disputes", AdminDisputeListView.as_view(), name="admin-disputes"),
    path(
        "disputes/<int:dispute_id>/resolve",
        AdminDisputeResolveView.as_view(),
        name="admin-disputes-resolve",
    ),
    path(
        "settings/commission",
        AdminCommissionUpdateView.as_view(),
        name="admin-commission",
    ),
    path(
        "settings/commission/detail",
        AdminCommissionDetailView.as_view(),
        name="admin-commission-detail",
    ),
]
