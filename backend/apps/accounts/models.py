"""Account and authentication models."""
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, role="client", **extra):
        if not email:
            raise ValueError("Email required")
        email = self.normalize_email(email)
        user = self.model(email=email, role=role, **extra)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra):
        user = self.create_user(email=email, password=password, role="admin", **extra)
        user.is_staff = True
        user.is_superuser = True
        user.verification_status = "verified"
        user.is_verified = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CLIENT = "client"
    ROLE_FREELANCER = "freelancer"
    ROLE_ADMIN = "admin"
    ROLE_CHOICES = (
        (ROLE_CLIENT, "client"),
        (ROLE_FREELANCER, "freelancer"),
        (ROLE_ADMIN, "admin"),
    )

    VERIFICATION_UNVERIFIED = "unverified"
    VERIFICATION_PENDING = "pending"
    VERIFICATION_VERIFIED = "verified"
    VERIFICATION_SUSPENDED = "suspended"
    VERIFICATION_STATUS_CHOICES = (
        (VERIFICATION_UNVERIFIED, "Unverified"),
        (VERIFICATION_PENDING, "Pending"),
        (VERIFICATION_VERIFIED, "Verified"),
        (VERIFICATION_SUSPENDED, "Suspended"),
    )

    VERIFICATION_TYPE_INDIVIDUAL = "individual"
    VERIFICATION_TYPE_BUSINESS = "business"
    VERIFICATION_TYPE_CHOICES = (
        (VERIFICATION_TYPE_INDIVIDUAL, "Хувь хүн"),
        (VERIFICATION_TYPE_BUSINESS, "Байгууллага"),
    )

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_CLIENT)
    is_verified = models.BooleanField(default=False)
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_STATUS_CHOICES, default=VERIFICATION_UNVERIFIED)
    verification_type = models.CharField(max_length=20, choices=VERIFICATION_TYPE_CHOICES, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    rejection_reason = models.TextField(blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = []
    objects = UserManager()

    def save(self, *args, **kwargs):
        self.is_verified = (self.verification_status == self.VERIFICATION_VERIFIED)
        super().save(*args, **kwargs)


class EmailOTP(models.Model):
    email = models.EmailField()
    otp_hash = models.CharField(max_length=255)
    otp_token = models.CharField(max_length=64, unique=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    failed_attempts = models.PositiveSmallIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        indexes = [
            models.Index(fields=["email", "is_used", "expires_at"], name="idx_otp_email_used_exp"),
        ]
