"""Profile routes."""
from django.urls import path

from .views import ProfileDetailView, ProfileMeView

urlpatterns = [
    path("profiles/<int:user_id>", ProfileDetailView.as_view(), name="profile-detail"),
    path("profiles/me", ProfileMeView.as_view(), name="profile-me"),
]
