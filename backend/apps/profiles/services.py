from .models import Profile
from django.contrib.auth import get_user_model
from rest_framework.exceptions import PermissionDenied

User = get_user_model()


class ProfileService:
    @staticmethod
    def update(user, validated_data: dict) -> Profile:
        """
        Updates a user's profile.
        """
        profile, _ = Profile.objects.update_or_create(
            user=user, defaults=validated_data
        )
        return profile

    @staticmethod
    def verify(user_to_verify: User, actor: User) -> User:
        """
        Verifies a user, typically performed by an admin.
        """
        if not actor.is_staff:  # Or some other permission check
            raise PermissionDenied("Only staff can verify users.")
        user_to_verify.is_verified = True
        user_to_verify.save(update_fields=["is_verified"])
        return user_to_verify
