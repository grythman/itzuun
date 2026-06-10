"""Notification domain helpers."""

import logging

from django.contrib.auth import get_user_model

from .models import Notification

logger = logging.getLogger(__name__)
User = get_user_model()


def notify_admins_new_brief(project) -> int:
    """
    Create a notification for every admin user when a new project brief is submitted.
    Returns the number of notifications created.
    """
    admins = User.objects.filter(role=User.ROLE_ADMIN, is_active=True)
    if not admins.exists():
        logger.warning("No active admin users to notify about project %s", project.id)
        return 0

    notifications = []
    for admin in admins:
        notifications.append(
            Notification(
                user=admin,
                type="NEW_BRIEF",
                title=f"Шинэ brief: {project.title or 'Untitled'}",
                description=(
                    f"Client {project.owner.email} шинэ захиалга илгээлээ. "
                    f"Категори: {project.category or 'N/A'}, "
                    f"Төсөв: {project.budget:,.0f}₮, "
                    f"Хугацаа: {project.timeline_days} хоног."
                ),
                metadata={
                    "project_id": project.id,
                    "owner_email": project.owner.email,
                    "category": project.category or "",
                    "budget": project.budget,
                },
            )
        )

    created = Notification.objects.bulk_create(notifications)
    logger.info(
        "Created %d admin notifications for new brief (project %s)",
        len(created),
        project.id,
    )
    return len(created)
