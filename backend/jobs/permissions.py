from rest_framework import permissions
from users.models import User


class IsRecruiterOrReadOnly(permissions.BasePermission):
    """
    Custom permission to allow read access to all, but only recruiters can create jobs.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == User.Role.JOB_RECRUITER
        )


class IsJobOwner(permissions.BasePermission):
    """
    Object-level permission to only allow the recruiter who created the job to edit/delete it.
    Superusers/staff are also allowed.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.user.is_staff or request.user.is_superuser:
            return True
        return obj.recruiter == request.user
