"""Profile views."""
from django.core.cache import cache
from rest_framework import generics
from rest_framework.response import Response
from common.cache_utils import bump_user_public_version, profile_cache_key

from .models import Profile
from .serializers import ProfileSerializer


class ProfileDetailView(generics.RetrieveAPIView):
    queryset = Profile.objects.select_related("user")
    serializer_class = ProfileSerializer
    lookup_field = "user_id"

    def retrieve(self, request, *args, **kwargs):
        user_id = kwargs["user_id"]
        cache_key = profile_cache_key(user_id)
        cached_payload = cache.get(cache_key)
        if cached_payload is not None:
            return Response(cached_payload)

        response = super().retrieve(request, *args, **kwargs)
        cache.set(cache_key, response.data, timeout=120)
        return response


class ProfileMeView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer

    def get_object(self):
        profile, _created = Profile.objects.get_or_create(user=self.request.user)
        return profile

    def get(self, request, *args, **kwargs):
        profile = self.get_object()
        cache_key = profile_cache_key(request.user.id)
        cached_payload = cache.get(cache_key)
        if cached_payload is not None:
            return Response(cached_payload)

        payload = self.get_serializer(profile).data
        cache.set(cache_key, payload, timeout=120)
        return Response(payload)

    def perform_update(self, serializer):
        serializer.save()
        bump_user_public_version(self.request.user.id)
