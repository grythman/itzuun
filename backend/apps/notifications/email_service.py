"""Email notification helpers."""

import logging

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def send_brief_email(project) -> bool:
    """Email all admins when a new brief is submitted."""
    subject = f"[ITZuun] Шинэ brief: {project.title or 'Untitled'}"
    body = (
        f"Шинэ захиалга орлоо.\n\n"
        f"Клиент: {project.owner.email}\n"
        f"Категори: {project.category or 'N/A'}\n"
        f"Төсөв: {project.budget:,.0f}₮\n"
        f"Хугацаа: {project.timeline_days} хоног\n\n"
        f"Админ самбараас шалгана уу."
    )
    try:
        from django.contrib.auth import get_user_model

        User = get_user_model()
        emails = list(
            User.objects.filter(role=User.ROLE_ADMIN, is_active=True).values_list(
                "email", flat=True
            )
        )
        if not emails:
            return False
        send_mail(
            subject,
            body,
            settings.DEFAULT_FROM_EMAIL,
            emails,
            fail_silently=True,
        )
        logger.info("Sent brief email to %d admins", len(emails))
        return True
    except Exception:
        logger.exception("Failed to send brief email")
        return False


def send_status_change_email(project, new_status: str) -> bool:
    """Email project owner when status changes."""
    subject = f"[ITZuun] Төслийн төлөв: {new_status}"
    body = (
        f"Таны '{project.title or 'Untitled'}' төслийн "
        f"төлөв '{new_status}' болж өөрчлөгдлөө.\n\n"
        f"Дэлгэрэнгүй мэдээллийг платформоос харна уу."
    )
    try:
        send_mail(
            subject,
            body,
            settings.DEFAULT_FROM_EMAIL,
            [project.owner.email],
            fail_silently=True,
        )
        logger.info("Sent status email to %s", project.owner.email)
        return True
    except Exception:
        logger.exception("Failed to send status change email")
        return False
