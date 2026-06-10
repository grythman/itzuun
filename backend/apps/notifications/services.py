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


def notify_project_status_change(project, new_status: str, actor=None) -> int:
    """
    Create notifications when a project status changes.
    Notifies the project owner and, if the actor is not the owner, also notifies admins.
    Returns the count of notifications created.
    """
    notifications = []

    # Always notify the project owner
    notifications.append(
        Notification(
            user=project.owner,
            type="STATUS_CHANGE",
            title=f"Төслийн төлөв шинэчлэгдлээ: {new_status}",
            description=(
                f"Таны '{project.title or 'Untitled'}' төслийн төлөв "
                f"'{new_status}' болж өөрчлөгдлөө."
            ),
            metadata={
                "project_id": project.id,
                "new_status": new_status,
            },
        )
    )

    # Notify admins if the actor is not the owner (or no actor)
    if actor and actor != project.owner:
        admins = User.objects.filter(role=User.ROLE_ADMIN, is_active=True).exclude(
            id=actor.id
        )
        for admin in admins:
            notifications.append(
                Notification(
                    user=admin,
                    type="STATUS_CHANGE",
                    title=f"Төслийн төлөв шинэчлэгдлээ: {new_status}",
                    description=(
                        f"'{project.title or 'Untitled'}' төслийн төлөв "
                        f"'{new_status}' болж өөрчлөгдлөө."
                    ),
                    metadata={
                        "project_id": project.id,
                        "new_status": new_status,
                    },
                )
            )

    created = Notification.objects.bulk_create(notifications)
    logger.info(
        "Created %d status change notifications for project %s",
        len(created),
        project.id,
    )
    return len(created)
