from django.db.models import Avg, Count, Q, QuerySet
from django.db.models.functions import Coalesce

from .models import Profile


class ProfileSelector:
    @staticmethod
    def get_profiles(filters: dict = None) -> QuerySet:
        """
        Returns a queryset of profiles based on the given filters.
        """
        filters = filters or {}
        queryset = (
            Profile.objects.select_related("user")
            .annotate(
                avg_rating=Coalesce(Avg("user__reviews_received__rating"), 0.0),
                review_count=Count("user__reviews_received"),
            )
            .order_by("-last_active")
        )

        if search := filters.get("search"):
            queryset = queryset.filter(
                Q(full_name__icontains=search)
                | Q(title__icontains=search)
                | Q(bio__icontains=search)
                | Q(skills__icontains=search)
            )
        if skill := filters.get("skill"):
            queryset = queryset.filter(skills__icontains=skill)

        if verified := filters.get("verified"):
            if verified.lower() in {"true", "1"}:
                queryset = queryset.filter(user__is_verified=True)

        if min_rating := filters.get("min_rating"):
            try:
                queryset = queryset.filter(avg_rating__gte=float(min_rating))
            except ValueError:
                pass

        return queryset
