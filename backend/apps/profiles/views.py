from rest_framework import generics, permissions

from .models import Profile
from .selectors import ProfileSelector
from .serializers import ProfileSerializer
from .services import ProfileService


class ProfileListView(generics.ListAPIView):
    """Lists all profiles."""

    serializer_class = ProfileSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return ProfileSelector.get_profiles(self.request.query_params)


class ProfileDetailView(generics.RetrieveAPIView):
    """Retrieres a single profile by user ID."""

    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "user_id"

    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)


class ProfileMeView(generics.RetrieveUpdateAPIView):
    """Retrieves or updates the profile of the currently authenticated user."""

    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # Use get_or_create to ensure a profile exists for the user
        profile, created = Profile.objects.get_or_create(user=self.request.user)
        return profile

    def perform_update(self, serializer):
        ProfileService.update(self.request.user, serializer.validated_data)
