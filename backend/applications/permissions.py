from rest_framework import permissions
from users.models import User


class CanApplyPermission(permissions.BasePermission):
    """
    Only authenticated Job Seekers can apply for jobs.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == User.Role.JOB_SEEKER
        )


class IsApplicationParticipant(permissions.BasePermission):
    """
    Only the applicant who submitted the application OR the recruiter who posted the job can view it.
    Staff and superusers have full access.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff or request.user.is_superuser:
            return True
        return obj.applicant == request.user or obj.job.recruiter == request.user


class IsRecruiterJobOwner(permissions.BasePermission):
    """
    Only the recruiter who owns the job can change the application status.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff or request.user.is_superuser:
            return True
        return (
            request.user.role == User.Role.JOB_RECRUITER and
            obj.job.recruiter == request.user
        )
