"""Account permissions."""
from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated and request.user.role == "admin")


class IsRole(BasePermission):
    def __init__(self, role: str) -> None:
        self.role = role

    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated and request.user.role == self.role)
