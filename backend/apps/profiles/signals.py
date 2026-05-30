"""Auto-create a Profile whenever a new User is saved for the first time."""

from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        from apps.profiles.models import Profile  # local import avoids circular deps

        Profile.objects.get_or_create(user=instance)
