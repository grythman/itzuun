from django.db.models import QuerySet

from apps.payments.models import Dispute
from apps.projects.models import Project


class AdminSelector:
    @staticmethod
    def get_flagged_projects() -> QuerySet:
        """
        Returns a queryset of projects that are disputed.
        """
        return (
            Project.objects.filter(status=Project.STATUS_DISPUTED)
            .select_related("owner", "selected_proposal__freelancer")
            .order_by("-updated_at")
        )

    @staticmethod
    def get_pending_disputes() -> QuerySet:
        """
        Returns a queryset of disputes that have not been resolved.
        """
        return (
            Dispute.objects.filter(resolved_at__isnull=True)
            .select_related("project", "raised_by", "resolved_by")
            .order_by("created_at")
        )
