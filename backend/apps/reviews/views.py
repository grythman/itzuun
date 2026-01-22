"""Review views."""
from django.db.models import Avg, Count
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.projects.models import Project

from .models import Review
from .serializers import ReviewSerializer


class ProjectReviewCreateView(generics.CreateAPIView):
    serializer_class = ReviewSerializer

    def perform_create(self, serializer):
        project = Project.objects.get(id=self.kwargs["project_id"])
        serializer.save(project=project, reviewer=self.request.user)


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
