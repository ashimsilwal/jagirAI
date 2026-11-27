from rest_framework import permissions
from users.models import User
from organizations.permissions import check_org_permission
from organizations.services import get_user_membership


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
    Only the applicant who submitted the application OR an authorized organization
    member with 'application.view' for the job's organization can view it.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff or request.user.is_superuser:
            return True

        if obj.applicant == request.user:
            return True

        # Check organization-level view permission
        org = obj.job.organization
        if org:
            if org.owner_id == request.user.id:
                return True
            membership = get_user_membership(request.user, org.id)
            if membership and membership.status == 'ACTIVE':
                return membership.has_permission('application.view')

        return obj.job.recruiter == request.user


class IsRecruiterJobOwner(permissions.BasePermission):
    """
    Only the recruiter or an authorized organization member with 'application.update_status'
    can change the application status.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff or request.user.is_superuser:
            return True

        if request.user.role != User.Role.JOB_RECRUITER:
            return False

        org = obj.job.organization
        if org:
            if org.owner_id == request.user.id:
                return True
            membership = get_user_membership(request.user, org.id)
            if membership and membership.status == 'ACTIVE':
                return membership.has_permission('application.update_status')
            return False

        return obj.job.recruiter == request.user
