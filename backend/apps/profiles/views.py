from django.db.models import Avg, Count, Q
from django.db.models.functions import Coalesce
from rest_framework import generics, permissions
from .models import Profile
from .serializers import ProfileSerializer

class ProfileListView(generics.ListAPIView):
    """Lists all profiles."""
    serializer_class = ProfileSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Profile.objects.select_related("user").all().annotate(
            avg_rating=Coalesce(Avg("user__reviews_received__rating"), 0.0),
            review_count=Count("user__reviews_received"),
        ).order_by("-last_active")

        search = (self.request.query_params.get("search") or "").strip()
        skill = (self.request.query_params.get("skill") or "").strip()
        verified = (self.request.query_params.get("verified") or "").strip().lower()
        min_rating = (self.request.query_params.get("min_rating") or "").strip()

        if search:
            queryset = queryset.filter(
                Q(full_name__icontains=search)
                | Q(title__icontains=search)
                | Q(bio__icontains=search)
                | Q(skills__icontains=search)
            )
        if skill:
            queryset = queryset.filter(skills__icontains=skill)
        if verified in {"true", "1"}:
            queryset = queryset.filter(user__is_verified=True)
        if min_rating:
            try:
                queryset = queryset.filter(avg_rating__gte=float(min_rating))
            except ValueError:
                pass
        return queryset

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
