"""Review views."""

from django.core.cache import cache
from django.db.models import Avg, Count
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.projects.models import Project
from common.cache_utils import (
    bump_user_public_version,
    rating_summary_cache_key,
    user_reviews_cache_key,
)

from .models import Review
from .selectors import ReviewSelector
from .serializers import ReviewSerializer
from .services import ReviewService


class ProjectReviewCreateView(generics.CreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        project = get_object_or_404(
            Project.objects.select_related("selected_proposal"),
            id=self.kwargs["project_id"],
        )

        selected = getattr(project, "selected_proposal", None)
        freelancer_id = getattr(selected, "freelancer_id", None)
        is_owner = project.owner_id == self.request.user.id
        is_selected_freelancer = freelancer_id == self.request.user.id
        if not (is_owner or is_selected_freelancer):
            raise PermissionDenied("Only project participants can review.")
        reviewee_id = freelancer_id if is_owner else project.owner_id

        review = ReviewService.create(
            project=project,
            reviewer=self.request.user,
            reviewee_id=reviewee_id,
            rating=serializer.validated_data["rating"],
            comment=serializer.validated_data.get("comment", ""),
        )
        serializer.instance = review
        bump_user_public_version(review.reviewee_id)


class UserReviewsListView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        # We need to get the user object to pass to the selector.
        # The user_id is in the URL kwargs.
        return ReviewSelector.get_by_user(user=self.kwargs["user_id"])

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
    permission_classes = [permissions.AllowAny]

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
