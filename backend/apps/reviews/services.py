from django.db import IntegrityError
from .models import Review
from apps.projects.models import Project
from common.exceptions import BusinessLogicError


class ReviewService:
    @staticmethod
    def validate_one_per_project(project: Project, reviewer):
        """
        Validates that a user can only review a project once.
        """
        if Review.objects.filter(project=project, reviewer=reviewer).exists():
            raise BusinessLogicError("You have already reviewed this project.")

    @staticmethod
    def create(
        project: Project, reviewer, reviewee, rating: int, comment: str
    ) -> Review:
        """
        Creates a new review after performing business logic validations.
        """
        ReviewService.validate_one_per_project(project, reviewer)

        if project.status != Project.STATUS_COMPLETED:
            raise BusinessLogicError(
                "Reviews can only be left after project completion."
            )

        # Only owner and selected freelancer may review each other
        selected = getattr(project, "selected_proposal", None)
        freelancer_id = getattr(selected, "freelancer_id", None)
        is_owner = project.owner_id == reviewer.id
        is_freelancer = freelancer_id == reviewer.id
        if not (is_owner or is_freelancer):
            raise BusinessLogicError("Only project participants can review.")

        if reviewee.id != (freelancer_id if is_owner else project.owner_id):
            raise BusinessLogicError("Reviewee is not the other project participant.")

        try:
            return Review.objects.create(
                project=project,
                reviewer=reviewer,
                reviewee=reviewee,
                rating=rating,
                comment=comment,
            )
        except IntegrityError as e:
            # This can happen if there's a race condition.
            # The unique constraint on (project, reviewer) would be violated.
            raise BusinessLogicError("You have already reviewed this project.") from e
