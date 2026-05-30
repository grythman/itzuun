from rest_framework import generics, permissions, status
from rest_framework.response import Response

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
    """Retrieves a single profile by user ID.

    Uses get_or_create so that freshly registered users always have a
    profile row even if the post_save signal fired before the migration
    ran (e.g. data migrated from a previous database).
    """

    serializer_class = ProfileSerializer
    permission_classes = [permissions.AllowAny]

    def retrieve(self, request, *args, **kwargs):
        from django.contrib.auth import get_user_model

        User = get_user_model()
        user_id = self.kwargs.get("user_id")
        if not User.objects.filter(id=user_id).exists():
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        profile, _ = Profile.objects.get_or_create(user_id=user_id)
        serializer = self.get_serializer(profile)
        return Response(serializer.data)


class ProfileMeView(generics.RetrieveUpdateAPIView):
    """Retrieves or updates the profile of the currently authenticated user."""

    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, _ = Profile.objects.get_or_create(user=self.request.user)
        return profile

    def perform_update(self, serializer):
        ProfileService.update(self.request.user, serializer.validated_data)
