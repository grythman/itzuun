from django.urls import re_path
from .views import ProfileMeView, ProfileDetailView, ProfileListView

urlpatterns = [
    re_path(r"^profiles/me/?$", ProfileMeView.as_view(), name="profile-me"),
    re_path(r"^profiles/?$", ProfileListView.as_view(), name="profile-list"),
    re_path(r"^profiles/(?P<user_id>\d+)/?$", ProfileDetailView.as_view(), name="profile-detail"),
]
