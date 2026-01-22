"""Admin panel routes."""
from django.urls import path

from .views import (
    AdminCommissionDetailView,
    AdminCommissionUpdateView,
    AdminDisputeResolveView,
    AdminProjectListView,
    AdminUserListView,
    AdminUserVerifyView,
)

urlpatterns = [
    path("users", AdminUserListView.as_view(), name="admin-users"),
    path("users/<int:user_id>/verify", AdminUserVerifyView.as_view(), name="admin-users-verify"),
    path("projects", AdminProjectListView.as_view(), name="admin-projects"),
    path("disputes/<int:dispute_id>/resolve", AdminDisputeResolveView.as_view(), name="admin-disputes-resolve"),
    path("settings/commission", AdminCommissionUpdateView.as_view(), name="admin-commission"),
    path("settings/commission/detail", AdminCommissionDetailView.as_view(), name="admin-commission-detail"),
]
