"""Profile routes."""
from django.urls import path

from .views import ProfileDetailView, ProfileListView, ProfileMeView

urlpatterns = [
    path("profiles", ProfileListView.as_view(), name="profile-list"),
    path("profiles/<int:user_id>", ProfileDetailView.as_view(), name="profile-detail"),
    path("profiles/me", ProfileMeView.as_view(), name="profile-me"),
]
