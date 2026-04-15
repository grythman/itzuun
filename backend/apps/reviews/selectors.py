from django.db.models import QuerySet
from .models import Review

class ReviewSelector:
    @staticmethod
    def get_by_project(project_id: int) -> QuerySet:
        """
        Returns all reviews for a given project.
        """
        return (Review.objects
                .filter(project_id=project_id)
                .select_related('reviewer', 'reviewee')
                .order_by('-created_at'))

    @staticmethod
    def get_by_user(user) -> QuerySet:
        """
        Returns all reviews received by a given user.
        """
        return (Review.objects
                .filter(reviewee=user)
                .select_related('reviewer', 'project')
                .order_by('-created_at'))
