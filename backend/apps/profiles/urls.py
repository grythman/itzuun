from django.urls import path
from .views import ProfileMeView, ProfileDetailView, ProfileListView

urlpatterns = [
    # Зураастай болон зураасгүй аль алинаар нь хандах боломжтой болгов
    path("profiles/me/", ProfileMeView.as_view(), name="profile-me"),
    path("profiles/me", ProfileMeView.as_view()),
    
    path("profiles/", ProfileListView.as_view(), name="profile-list"),
    path("profiles", ProfileListView.as_view()),
    
    path("profiles/<int:user_id>/", ProfileDetailView.as_view(), name="profile-detail"),
    path("profiles/<int:user_id>", ProfileDetailView.as_view()),
]
