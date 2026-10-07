from rest_framework import permissions
from .models import User


class IsJobSeeker(permissions.BasePermission):
    """
    Allows access only to authenticated users with role JOB_SEEKER.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == User.Role.JOB_SEEKER
        )


class IsRecruiter(permissions.BasePermission):
    """
    Allows access only to authenticated users with role JOB_RECRUITER.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == User.Role.JOB_RECRUITER
        )


class IsSuperAdminUser(permissions.BasePermission):
    """
    Allows access only to superusers/staff.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.is_staff or request.user.is_superuser)
        )
