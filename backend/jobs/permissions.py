from rest_framework import permissions
from users.models import User
from organizations.permissions import check_org_permission
from organizations.services import get_user_membership, get_or_create_user_organization


class IsRecruiterOrReadOnly(permissions.BasePermission):
    """
    Allows read access to anyone.
    Allows job creation only for users who are recruiters or organization members with 'vacancy.create'.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        if getattr(request.user, 'must_change_password', False):
            return False
        if request.user.is_staff or request.user.is_superuser:
            return True
        if request.user.role == User.Role.JOB_RECRUITER:
            org = get_or_create_user_organization(request.user)
            return check_org_permission(request.user, org, 'vacancy.create')
        return False


class IsJobOwner(permissions.BasePermission):
    """
    Object-level permission allowing the recruiter who created the job or an authorized
    organization member with appropriate permissions (vacancy.edit, vacancy.delete, vacancy.publish).
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff or request.user.is_superuser:
            return True

        # Check organization-level permissions
        org = obj.organization
        if not org:
            # Fallback to direct creator ownership
            return obj.recruiter == request.user

        # Owner has full control
        if org.owner_id == request.user.id:
            return True

        # Check membership in the job's organization
        membership = get_user_membership(request.user, org.id)
        if not membership or membership.status != 'ACTIVE':
            return False

        if request.method in ['PUT', 'PATCH']:
            # If changing status, check vacancy.publish
            if 'status' in request.data and request.data['status'] != obj.status:
                if not membership.has_permission('vacancy.publish'):
                    return False
            return membership.has_permission('vacancy.edit')

        if request.method == 'DELETE':
            return membership.has_permission('vacancy.delete')

        return False
