"""Profile views."""
from rest_framework import generics
from rest_framework.response import Response

from .models import Profile
from .serializers import ProfileSerializer


class ProfileDetailView(generics.RetrieveAPIView):
    queryset = Profile.objects.select_related("user")
    serializer_class = ProfileSerializer
    lookup_field = "user_id"


class ProfileMeView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer

    def get_object(self):
        profile, _created = Profile.objects.get_or_create(user=self.request.user)
        return profile

    def get(self, request, *args, **kwargs):
        profile = self.get_object()
        return Response(self.get_serializer(profile).data)
