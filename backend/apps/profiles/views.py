from rest_framework import generics, permissions
from .models import Profile
from .serializers import ProfileSerializer

class ProfileListView(generics.ListAPIView):
    """Lists all profiles."""
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [permissions.AllowAny]

class ProfileDetailView(generics.RetrieveAPIView):
    """Retrieves a single profile by user ID."""
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'user_id'

    def retrieve(self, request, *args, **kwargs):
        user_id = self.kwargs.get("user_id")
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
