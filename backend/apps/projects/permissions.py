"""Project permissions."""

from rest_framework.permissions import BasePermission


class IsClient(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "client"


class IsFreelancer(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "freelancer"


class IsProjectOwnerForPayment(BasePermission):
    """
    Object-level permission to only allow owners of a project to perform payment actions.
    """

    def has_object_permission(self, request, view, obj):
        # obj is expected to be a Project instance
        return obj.owner == request.user
