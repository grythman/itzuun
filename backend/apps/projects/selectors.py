from django.db.models import Q, QuerySet
from .models import Project

class ProjectSelector:
    @staticmethod
    def get_projects(filters: dict = None) -> QuerySet:
        """
        Returns a queryset of projects based on the given filters.
        """
        filters = filters or {}
        queryset = (
            Project.objects.select_related("owner", "selected_proposal__freelancer")
            .prefetch_related("proposals")
            .all()
            .order_by("-created_at")
        )

        if status_filter := filters.get("status"):
            queryset = queryset.filter(status=status_filter)
        if category_filter := filters.get("category"):
            queryset = queryset.filter(category=category_filter)
        if search := filters.get("search"):
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )
        if skills := filters.get("skills"):
            skill_terms = [item.strip() for item in skills.split(",") if item.strip()]
            for skill in skill_terms:
                queryset = queryset.filter(required_skills__icontains=skill)

        try:
            budget_min = int(filters.get("budget_min")) if filters.get("budget_min") else None
        except (TypeError, ValueError):
            budget_min = None
        try:
            budget_max = int(filters.get("budget_max")) if filters.get("budget_max") else None
        except (TypeError, ValueError):
            budget_max = None

        if budget_min is not None:
            queryset = queryset.filter(budget__gte=max(0, budget_min))
        if budget_max is not None:
            queryset = queryset.filter(budget__lte=max(0, budget_max))

        if experience := filters.get("experience"):
            if experience == "entry":
                queryset = queryset.filter(timeline_days__lte=14)
            elif experience == "intermediate":
                queryset = queryset.filter(timeline_days__gt=14, timeline_days__lte=45)
            elif experience == "expert":
                queryset = queryset.filter(timeline_days__gt=45)

        return queryset

    @staticmethod
    def get_by_owner(user) -> QuerySet:
        """
        Returns a queryset of projects owned by a given user.
        """
        return (Project.objects
                .filter(owner=user)
                .select_related('owner')
                .prefetch_related('proposals')
                .order_by('-created_at'))

    @staticmethod
    def get_open_projects() -> QuerySet:
        """
        Returns a queryset of all projects with 'open' status.
        """
        return (Project.objects
                .filter(status=Project.STATUS_OPEN)
                .select_related('owner__profile'))
