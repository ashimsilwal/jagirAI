from rest_framework import permissions
from .services import get_user_membership, get_or_create_user_organization
from .constants import ALL_PERMISSIONS


class HasOrganizationMembership(permissions.BasePermission):
    """
    Ensures the user has an active organization membership.
    Attaches `request.org` and `request.membership` to the request.
    """
    message = "You must be an active member of an organization to access this resource."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if getattr(request.user, 'must_change_password', False):
            self.message = "You must change your one-time password before accessing organization tools."
            return False

        if request.user.is_staff or request.user.is_superuser:
            # Superadmin bypass attaches their primary or created organization
            request.org = get_or_create_user_organization(request.user)
            request.membership = get_user_membership(request.user, request.org.id)
            return True

        membership = get_user_membership(request.user)
        if not membership or membership.status != 'ACTIVE':
            # Check if user is an owner of an organization
            org = get_or_create_user_organization(request.user)
            membership = get_user_membership(request.user, org.id)
            if not membership or membership.status != 'ACTIVE':
                return False

        request.org = membership.organization
        request.membership = membership
        return True


class HasOrgPermission(permissions.BasePermission):
    """
    Factory-like permission class checking for a specific granular permission code.
    Usage:
        permission_classes = [permissions.IsAuthenticated, HasOrgPermission('vacancy.create')]
    Or dynamically in view:
        def check_perm(self, perm): ...
    """
    def __init__(self, required_permission: str):
        self.required_permission = required_permission

    def __call__(self):
        return self

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Superadmins pass
        if request.user.is_staff or request.user.is_superuser:
            if not hasattr(request, 'org'):
                request.org = get_or_create_user_organization(request.user)
                request.membership = get_user_membership(request.user, request.org.id)
            return True

        if not hasattr(request, 'membership') or not request.membership:
            membership = get_user_membership(request.user)
            if not membership:
                org = get_or_create_user_organization(request.user)
                membership = get_user_membership(request.user, org.id)
            if not membership or membership.status != 'ACTIVE':
                return False
            request.org = membership.organization
            request.membership = membership

        # Org Owner has all permissions
        if request.org.owner_id == request.user.id or request.membership.role.slug == 'owner':
            return True

        return request.membership.has_permission(self.required_permission)


class IsOrgOwner(permissions.BasePermission):
    """
    Strict permission allowing only the owner of the organization.
    """
    message = "Only the organization owner can perform this action."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff or request.user.is_superuser:
            return True

        if not hasattr(request, 'org') or not request.org:
            request.org = get_or_create_user_organization(request.user)

        return request.org.owner_id == request.user.id


def check_org_permission(user, organization, permission_code: str) -> bool:
    """
    Helper function to check permission directly on a user and organization.
    """
    if not user or not user.is_authenticated:
        return False
    if getattr(user, 'must_change_password', False):
        return False
    if user.is_staff or user.is_superuser:
        return True
    if organization.owner_id == user.id:
        return True
    membership = get_user_membership(user, organization.id)
    if not membership or membership.status != 'ACTIVE':
        return False
    return membership.has_permission(permission_code)
