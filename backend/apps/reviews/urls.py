"""Review routes."""
from django.urls import path

from .views import ProjectReviewCreateView, UserRatingSummaryView, UserReviewsListView

urlpatterns = [
    path("projects/<int:project_id>/reviews", ProjectReviewCreateView.as_view(), name="project-reviews"),
    path("users/<int:user_id>/reviews", UserReviewsListView.as_view(), name="user-reviews"),
    path("users/<int:user_id>/rating-summary", UserRatingSummaryView.as_view(), name="rating-summary"),
]
