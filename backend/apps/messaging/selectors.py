from django.db.models import QuerySet
from .models import ProjectMessage


class MessageSelector:
    @staticmethod
    def get_thread(project_id: int) -> QuerySet:
        """
        Returns all messages for a given project, ordered by creation time.
        """
        return (
            ProjectMessage.objects.filter(project_id=project_id)
            .select_related("sender")
            .order_by("created_at")
        )

    @staticmethod
    def get_unread(user) -> QuerySet:
        """
        This is a placeholder as there is no 'read' status on the model.
        To implement this, the ProjectMessage model would need a 'read_at' timestamp
        or a many-to-many relationship to track read status for each user.
        """
        # Returning an empty queryset for now.
        return ProjectMessage.objects.none()
