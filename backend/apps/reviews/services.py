from django.contrib.auth import get_user_model
from django.db import IntegrityError

from apps.projects.models import Project
from common.exceptions import BusinessLogicError

from .models import Review

User = get_user_model()


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
        project: Project,
        reviewer,
        reviewee=None,
        reviewee_id=None,
        rating: int = 0,
        comment: str = "",
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

        expected_reviewee_id = freelancer_id if is_owner else project.owner_id

        if reviewee is None and reviewee_id is None:
            raise BusinessLogicError("Reviewee is required.")
        if reviewee is None:
            reviewee = User.objects.filter(id=reviewee_id).first()
            if reviewee is None:
                raise BusinessLogicError("Reviewee does not exist.")

        if reviewee.id != expected_reviewee_id:
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
