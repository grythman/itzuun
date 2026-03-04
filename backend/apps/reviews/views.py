"""Review views."""
from django.db.models import Avg, Count
from django.core.cache import cache
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from common.cache_utils import bump_user_public_version, rating_summary_cache_key, user_reviews_cache_key
from apps.projects.models import Project

from .models import Review
from .serializers import ReviewSerializer


class ProjectReviewCreateView(generics.CreateAPIView):
    serializer_class = ReviewSerializer

    def perform_create(self, serializer):
        project = get_object_or_404(Project.objects.select_related("selected_proposal"), id=self.kwargs["project_id"])
        if project.status != Project.STATUS_COMPLETED:
            raise ValidationError({"detail": "Reviews can only be left after project completion."})

        # Only owner and selected freelancer may review each other
        selected = getattr(project, "selected_proposal", None)
        freelancer_id = getattr(selected, "freelancer_id", None)
        is_owner = project.owner_id == self.request.user.id
        is_freelancer = freelancer_id == self.request.user.id
        if not (is_owner or is_freelancer):
            raise PermissionDenied("Only project participants can review.")

        # Prevent duplicate reviews by same user for same project
        if Review.objects.filter(project=project, reviewer=self.request.user).exists():
            raise ValidationError({"detail": "You already reviewed this project."})

        reviewee_id = freelancer_id if is_owner else project.owner_id
        serializer.save(project=project, reviewer=self.request.user, reviewee_id=reviewee_id)
        bump_user_public_version(reviewee_id)


class UserReviewsListView(generics.ListAPIView):
    serializer_class = ReviewSerializer

    def get_queryset(self):
        return Review.objects.filter(reviewee_id=self.kwargs["user_id"]).order_by("-created_at")

    def list(self, request, *args, **kwargs):
        user_id = kwargs["user_id"]
        cache_key = user_reviews_cache_key(user_id, request.query_params)
        cached_payload = cache.get(cache_key)
        if cached_payload is not None:
            return Response(cached_payload)

        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, timeout=180)
        return response


class UserRatingSummaryView(APIView):
    def get(self, request, user_id):
        cache_key = rating_summary_cache_key(user_id)
        cached_payload = cache.get(cache_key)
        if cached_payload is not None:
            return Response(cached_payload)

        summary = Review.objects.filter(reviewee_id=user_id).aggregate(
            avg_rating=Avg("rating"),
            total=Count("id"),
        )
        payload = {"average": summary["avg_rating"] or 0, "total": summary["total"]}
        cache.set(cache_key, payload, timeout=300)
        return Response(payload)
