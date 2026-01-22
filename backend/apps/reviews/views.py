"""Review views."""
from django.db.models import Avg, Count
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

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


class UserReviewsListView(generics.ListAPIView):
    serializer_class = ReviewSerializer

    def get_queryset(self):
        return Review.objects.filter(reviewee_id=self.kwargs["user_id"])


class UserRatingSummaryView(APIView):
    def get(self, request, user_id):
        summary = Review.objects.filter(reviewee_id=user_id).aggregate(
            avg_rating=Avg("rating"),
            total=Count("id"),
        )
        return Response({"average": summary["avg_rating"] or 0, "total": summary["total"]})
