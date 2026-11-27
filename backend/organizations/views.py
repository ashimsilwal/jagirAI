from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import views, generics, permissions, status, filters
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError

from .models import (
    Organization,
    OrganizationRole,
    OrganizationMembership,
    OrganizationInvitation,
    OrganizationActivityLog,
)
from .serializers import (
    OrganizationSerializer,
    OrganizationRoleSerializer,
    OrganizationMembershipSerializer,
    MemberUpdateSerializer,
    CreateMemberSerializer,
    ResetMemberPasswordSerializer,
    OrganizationInvitationSerializer,
    CreateInvitationSerializer,
    OrganizationActivityLogSerializer,
)
from .services import (
    get_or_create_user_organization,
    get_user_membership,
    create_invitation,
    validate_invitation,
    accept_invitation,
    create_organization_member,
    reset_member_password,
    log_activity,
    ensure_predefined_roles,
)
from .permissions import HasOrganizationMembership, HasOrgPermission
from .constants import ALL_PERMISSIONS, PREDEFINED_ROLES


class OrganizationDetailView(views.APIView):
    """
    GET /api/organizations/current/ -> Retrieve current user's organization profile
    PATCH /api/organizations/current/ -> Update organization profile
    """
    permission_classes = [permissions.IsAuthenticated, HasOrganizationMembership]

    def get(self, request):
        serializer = OrganizationSerializer(request.org)
        user_perms = list(request.membership.get_effective_permissions()) if request.membership else []
        return Response({
            "organization": serializer.data,
            "membership": OrganizationMembershipSerializer(request.membership).data if request.membership else None,
            "user_permissions": user_perms,
            "is_owner": request.org.owner_id == request.user.id
        })

    def patch(self, request):
        if not (request.org.owner_id == request.user.id or request.membership.has_permission('organization.update')):
            raise PermissionDenied("You do not have permission to update this organization.")

        serializer = OrganizationSerializer(request.org, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        log_activity(
            organization=request.org,
            actor=request.user,
            action=OrganizationActivityLog.Action.ORG_UPDATED,
            target_type='Organization',
            target_id=str(request.org.id),
            target_repr=request.org.name,
            metadata=request.data
        )

        return Response(serializer.data, status=status.HTTP_200_OK)


class OrganizationMembersListView(generics.ListAPIView):
    """
    GET /api/organizations/members/ -> Paginated team member list with search and filters
    """
    permission_classes = [permissions.IsAuthenticated, HasOrganizationMembership]
    serializer_class = OrganizationMembershipSerializer

    def get_queryset(self):
        if not (request_has_perm(self.request, 'team.view')):
            raise PermissionDenied("You do not have permission to view team members.")

        queryset = OrganizationMembership.objects.filter(
            organization=self.request.org
        ).select_related('user', 'role').order_by('-joined_at')

        role_filter = self.request.query_params.get('role')
        if role_filter:
            queryset = queryset.filter(role__slug=role_filter)

        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(user__username__icontains=search) |
                Q(user__email__icontains=search)
            )

        return queryset

    def post(self, request, *args, **kwargs):
        """
        Directly provision a new team member account, associate with organization,
        and assign role and permissions without sending an invitation email.
        """
        if not (request_has_perm(request, 'team.create_member') or request_has_perm(request, 'team.manage_members')):
            raise PermissionDenied("You do not have permission to add team members to this organization.")

        serializer = CreateMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Fetch and validate role
        role = get_object_or_404(
            OrganizationRole.objects.filter(Q(organization=request.org) | Q(organization__isnull=True)),
            id=data['role_id']
        )

        # Safety check: Cannot assign owner role unless caller is the organization owner
        if role.slug == 'owner' and request.org.owner_id != request.user.id:
            raise PermissionDenied("Only the organization owner can assign the owner role.")

        # Privilege escalation check: Non-owners cannot assign permissions they don't have
        if request.org.owner_id != request.user.id:
            actor_perms = request.membership.get_effective_permissions()
            role_perms = set(role.permissions or [])
            if not role_perms.issubset(actor_perms):
                raise PermissionDenied("You cannot assign a role with permissions that exceed your own authority.")

            custom_perms = set(data.get('custom_permissions', []))
            if not custom_perms.issubset(actor_perms):
                raise PermissionDenied("You cannot grant custom permissions that exceed your own authority.")

        membership, one_time_password = create_organization_member(
            organization=request.org,
            full_name=data['full_name'],
            email=data['email'],
            role=role,
            custom_permissions=data.get('custom_permissions', []),
            created_by=request.user,
        )

        return Response({
            "membership": OrganizationMembershipSerializer(membership).data,
            "one_time_password": one_time_password,
            "email": data['email'],
            "full_name": data['full_name'],
            "message": f"Team member account for {data['email']} created successfully with a one-time password."
        }, status=status.HTTP_201_CREATED)



class OrganizationMemberDetailView(views.APIView):
    """
    GET/PATCH/DELETE /api/organizations/members/<pk>/
    """
    permission_classes = [permissions.IsAuthenticated, HasOrganizationMembership]

    def get_member(self, request, pk):
        return get_object_or_404(
            OrganizationMembership.objects.select_related('user', 'role', 'organization'),
            id=pk,
            organization=request.org
        )

    def get(self, request, pk):
        if not request_has_perm(request, 'team.view'):
            raise PermissionDenied("You do not have permission to view team member details.")
        member = self.get_member(request, pk)
        return Response(OrganizationMembershipSerializer(member).data)

    def patch(self, request, pk):
        if not request_has_perm(request, 'team.manage_members'):
            raise PermissionDenied("You do not have permission to modify team members.")

        member = self.get_member(request, pk)
        is_owner = member.organization.owner_id == member.user_id

        serializer = MemberUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Safety check: Cannot demote or suspend owner
        if is_owner:
            if 'status' in data and data['status'] != OrganizationMembership.Status.ACTIVE:
                raise ValidationError({"detail": "The organization owner cannot be suspended."})
            if 'role_id' in data and data['role_id'] != member.role_id:
                raise ValidationError({"detail": "The organization owner role cannot be changed."})

        # Privilege escalation prevention: User cannot assign roles with permissions they don't have
        new_role = None
        if 'role_id' in data:
            new_role = get_object_or_404(
                OrganizationRole.objects.filter(Q(organization=request.org) | Q(organization__isnull=True)),
                id=data['role_id']
            )
            # Only owner can assign owner role
            if new_role.slug == 'owner' and request.org.owner_id != request.user.id:
                raise PermissionDenied("Only the organization owner can transfer ownership.")

            # Non-owners cannot assign permissions they don't possess
            if request.org.owner_id != request.user.id:
                actor_perms = request.membership.get_effective_permissions()
                role_perms = set(new_role.permissions or [])
                if not role_perms.issubset(actor_perms):
                    raise PermissionDenied("You cannot assign a role with permissions that exceed your own authority.")

            member.role = new_role

        if 'custom_permissions' in data:
            if request.org.owner_id != request.user.id:
                actor_perms = request.membership.get_effective_permissions()
                custom_set = set(data['custom_permissions'])
                if not custom_set.issubset(actor_perms):
                    raise PermissionDenied("You cannot grant custom permissions that exceed your own authority.")
            member.custom_permissions = data['custom_permissions']

        if 'status' in data:
            old_status = member.status
            member.status = data['status']
            if old_status != member.status:
                action_name = OrganizationActivityLog.Action.MEMBER_ACTIVATED if member.status == 'ACTIVE' else OrganizationActivityLog.Action.MEMBER_SUSPENDED
                log_activity(
                    organization=request.org,
                    actor=request.user,
                    action=action_name,
                    target_type='User',
                    target_id=str(member.user.id),
                    target_repr=member.user.email,
                    metadata={'previous_status': old_status, 'new_status': member.status}
                )

        member.save()

        log_activity(
            organization=request.org,
            actor=request.user,
            action=OrganizationActivityLog.Action.ROLE_ASSIGNED,
            target_type='User',
            target_id=str(member.user.id),
            target_repr=f"{member.user.email} -> {member.role.name}",
            metadata={'role': member.role.name, 'custom_permissions': member.custom_permissions}
        )

        return Response(OrganizationMembershipSerializer(member).data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        if not request_has_perm(request, 'team.remove_members'):
            raise PermissionDenied("You do not have permission to remove team members.")

        member = self.get_member(request, pk)

        # Cannot remove owner
        if member.organization.owner_id == member.user_id:
            raise ValidationError({"detail": "The organization owner cannot be removed."})

        # Cannot remove oneself via delete (must use leave)
        if member.user_id == request.user.id and request.org.owner_id != request.user.id:
            pass  # Allowed to leave

        user_email = member.user.email
        member.delete()

        log_activity(
            organization=request.org,
            actor=request.user,
            action=OrganizationActivityLog.Action.MEMBER_REMOVED,
            target_type='User',
            target_id=str(member.user_id),
            target_repr=user_email,
            metadata={'removed_by': request.user.email}
        )

        return Response({"message": f"{user_email} has been removed from the team."}, status=status.HTTP_200_OK)


class OrganizationMemberResetPasswordView(views.APIView):
    """
    POST /api/organizations/members/<pk>/reset_password/ -> Reset member's password directly
    """
    permission_classes = [permissions.IsAuthenticated, HasOrganizationMembership]

    def post(self, request, pk):
        if not request_has_perm(request, 'team.manage_members'):
            raise PermissionDenied("You do not have permission to reset team member passwords.")

        member = get_object_or_404(
            OrganizationMembership.objects.select_related('user', 'organization'),
            id=pk,
            organization=request.org
        )

        serializer = ResetMemberPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        reset_member_password(
            membership=member,
            new_password=serializer.validated_data['password'],
            actor=request.user
        )

        return Response({
            "message": f"Password for {member.user.email} has been successfully reset."
        }, status=status.HTTP_200_OK)


class OrganizationInvitationListCreateView(views.APIView):
    """
    GET /api/organizations/invitations/ -> List invitations
    POST /api/organizations/invitations/ -> Send new invitation
    """
    permission_classes = [permissions.IsAuthenticated, HasOrganizationMembership]

    def get(self, request):
        if not request_has_perm(request, 'team.view'):
            raise PermissionDenied("You do not have permission to view invitations.")

        qs = OrganizationInvitation.objects.filter(
            organization=request.org
        ).select_related('role', 'invited_by').order_by('-created_at')

        status_param = request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)

        serializer = OrganizationInvitationSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request_has_perm(request, 'team.invite'):
            raise PermissionDenied("You do not have permission to invite team members.")

        serializer = CreateInvitationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        role = get_object_or_404(
            OrganizationRole.objects.filter(Q(organization=request.org) | Q(organization__isnull=True)),
            id=data['role_id']
        )

        # Cannot invite as owner
        if role.slug == 'owner':
            raise ValidationError({"role_id": "Cannot send invitations for the Organization Owner role."})

        # Privilege escalation check: Cannot invite with permissions exceeding own
        if request.org.owner_id != request.user.id:
            actor_perms = request.membership.get_effective_permissions()
            role_perms = set(role.permissions or [])
            if not role_perms.issubset(actor_perms):
                raise PermissionDenied("You cannot invite members with a role that exceeds your own permissions.")

            if data.get('custom_permissions'):
                custom_set = set(data['custom_permissions'])
                if not custom_set.issubset(actor_perms):
                    raise PermissionDenied("You cannot grant custom permissions exceeding your own authority.")

        invitation, raw_token = create_invitation(
            organization=request.org,
            email=data['email'],
            role=role,
            custom_permissions=data.get('custom_permissions', []),
            invited_by=request.user,
            expiry_days=data.get('expiry_days', 7)
        )

        return Response({
            "message": f"Invitation successfully sent to {invitation.email}.",
            "invitation": OrganizationInvitationSerializer(invitation).data,
            "invitation_link": f"http://localhost:3000/invite/accept?token={raw_token}"
        }, status=status.HTTP_201_CREATED)


class OrganizationInvitationRevokeView(views.APIView):
    """
    POST /api/organizations/invitations/<pk>/revoke/
    """
    permission_classes = [permissions.IsAuthenticated, HasOrganizationMembership]

    def post(self, request, pk):
        if not request_has_perm(request, 'team.invite'):
            raise PermissionDenied("You do not have permission to revoke invitations.")

        invitation = get_object_or_404(
            OrganizationInvitation,
            id=pk,
            organization=request.org
        )

        if invitation.status != OrganizationInvitation.Status.PENDING:
            raise ValidationError({"detail": f"Cannot revoke an invitation with status {invitation.status}."})

        invitation.status = OrganizationInvitation.Status.REVOKED
        invitation.save(update_fields=['status'])

        log_activity(
            organization=request.org,
            actor=request.user,
            action=OrganizationActivityLog.Action.INVITATION_REVOKED,
            target_type='Invitation',
            target_id=str(invitation.id),
            target_repr=f"Revoked invite for {invitation.email}",
            metadata={'email': invitation.email}
        )

        return Response({"message": f"Invitation for {invitation.email} has been revoked."})


class OrganizationInvitationResendView(views.APIView):
    """
    POST /api/organizations/invitations/<pk>/resend/
    """
    permission_classes = [permissions.IsAuthenticated, HasOrganizationMembership]

    def post(self, request, pk):
        if not request_has_perm(request, 'team.invite'):
            raise PermissionDenied("You do not have permission to resend invitations.")

        invitation = get_object_or_404(
            OrganizationInvitation,
            id=pk,
            organization=request.org
        )

        # Revoke old and create fresh
        invitation.status = OrganizationInvitation.Status.REVOKED
        invitation.save(update_fields=['status'])

        new_inv, raw_token = create_invitation(
            organization=request.org,
            email=invitation.email,
            role=invitation.role,
            custom_permissions=invitation.custom_permissions,
            invited_by=request.user,
            expiry_days=7
        )

        return Response({
            "message": f"Fresh invitation resent to {invitation.email}.",
            "invitation": OrganizationInvitationSerializer(new_inv).data,
            "invitation_link": f"http://localhost:3000/invite/accept?token={raw_token}"
        })


class OrganizationRoleListCreateView(views.APIView):
    """
    GET /api/organizations/roles/ -> List predefined + custom roles
    POST /api/organizations/roles/ -> Create custom role
    """
    permission_classes = [permissions.IsAuthenticated, HasOrganizationMembership]

    def get(self, request):
        ensure_predefined_roles()
        roles = OrganizationRole.objects.filter(
            Q(organization__isnull=True) | Q(organization=request.org)
        ).order_by('id')
        serializer = OrganizationRoleSerializer(roles, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request_has_perm(request, 'team.manage_members'):
            raise PermissionDenied("You do not have permission to create custom roles.")

        serializer = OrganizationRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        perms = data.get('permissions', [])
        # Privilege escalation check: cannot create role with perms exceeding own
        if request.org.owner_id != request.user.id:
            actor_perms = request.membership.get_effective_permissions()
            if not set(perms).issubset(actor_perms):
                raise PermissionDenied("Cannot create a role containing permissions that exceed your own authority.")

        from django.utils.text import slugify
        slug = slugify(data['name'])
        counter = 1
        base_slug = slug
        while OrganizationRole.objects.filter(organization=request.org, slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1

        role = OrganizationRole.objects.create(
            organization=request.org,
            name=data['name'],
            slug=slug,
            description=data.get('description', ''),
            is_predefined=False,
            permissions=perms,
        )

        log_activity(
            organization=request.org,
            actor=request.user,
            action=OrganizationActivityLog.Action.ROLE_CREATED,
            target_type='Role',
            target_id=str(role.id),
            target_repr=role.name,
            metadata={'permissions': role.permissions}
        )

        return Response(OrganizationRoleSerializer(role).data, status=status.HTTP_201_CREATED)


class OrganizationRoleDetailView(views.APIView):
    """
    GET/PATCH/DELETE /api/organizations/roles/<pk>/
    """
    permission_classes = [permissions.IsAuthenticated, HasOrganizationMembership]

    def get_role(self, request, pk):
        return get_object_or_404(
            OrganizationRole,
            id=pk,
            organization=request.org
        )

    def get(self, request, pk):
        role = self.get_role(request, pk)
        return Response(OrganizationRoleSerializer(role).data)

    def patch(self, request, pk):
        if not request_has_perm(request, 'team.manage_members'):
            raise PermissionDenied("You do not have permission to modify roles.")

        role = self.get_role(request, pk)
        if role.is_predefined:
            raise ValidationError({"detail": "System predefined roles cannot be edited."})

        serializer = OrganizationRoleSerializer(role, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        if 'permissions' in serializer.validated_data and request.org.owner_id != request.user.id:
            actor_perms = request.membership.get_effective_permissions()
            if not set(serializer.validated_data['permissions']).issubset(actor_perms):
                raise PermissionDenied("Cannot assign permissions exceeding your own authority.")

        serializer.save()

        log_activity(
            organization=request.org,
            actor=request.user,
            action=OrganizationActivityLog.Action.ROLE_UPDATED,
            target_type='Role',
            target_id=str(role.id),
            target_repr=role.name,
            metadata=request.data
        )

        return Response(serializer.data)

    def delete(self, request, pk):
        if not request_has_perm(request, 'team.manage_members'):
            raise PermissionDenied("You do not have permission to delete roles.")

        role = self.get_role(request, pk)
        if role.is_predefined:
            raise ValidationError({"detail": "System predefined roles cannot be deleted."})

        # Cannot delete if assigned to active members
        if OrganizationMembership.objects.filter(role=role).exists():
            raise ValidationError({"detail": "Cannot delete this role because it is currently assigned to team members."})

        role_name = role.name
        role.delete()

        log_activity(
            organization=request.org,
            actor=request.user,
            action=OrganizationActivityLog.Action.ROLE_DELETED,
            target_type='Role',
            target_id=str(pk),
            target_repr=role_name,
        )

        return Response({"message": f"Custom role '{role_name}' deleted."}, status=status.HTTP_200_OK)


class OrganizationActivityLogListView(generics.ListAPIView):
    """
    GET /api/organizations/activity/ -> Paginated activity timeline
    """
    permission_classes = [permissions.IsAuthenticated, HasOrganizationMembership]
    serializer_class = OrganizationActivityLogSerializer

    def get_queryset(self):
        if not request_has_perm(self.request, 'activity.view'):
            raise PermissionDenied("You do not have permission to view the activity log.")

        qs = OrganizationActivityLog.objects.filter(
            organization=self.request.org
        ).select_related('actor').order_by('-created_at')

        action_param = self.request.query_params.get('action')
        if action_param:
            qs = qs.filter(action=action_param)

        return qs


class PublicInvitationValidateView(views.APIView):
    """
    GET /api/organizations/public-invite/validate/?token=<token>
    Validates token and returns summary metadata. Publicly accessible.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        token = request.query_params.get('token')
        invitation = validate_invitation(token)

        from users.models import User
        user_exists = User.objects.filter(email=invitation.email).exists()

        return Response({
            "valid": True,
            "organization_name": invitation.organization.name,
            "organization_logo": invitation.organization.logo.url if invitation.organization.logo else None,
            "email": invitation.email,
            "role_name": invitation.role.name,
            "role_description": invitation.role.description,
            "permissions": invitation.role.permissions,
            "invited_by": invitation.invited_by.username if invitation.invited_by else "Team Admin",
            "expires_at": invitation.expires_at,
            "user_exists": user_exists,
        })


class PublicInvitationAcceptView(views.APIView):
    """
    POST /api/organizations/public-invite/accept/
    Body: { "token": "..." }
    Requires user authentication.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            raise ValidationError({"token": "Token is required."})

        membership = accept_invitation(token, request.user)
        return Response({
            "message": f"Successfully joined {membership.organization.name} as {membership.role.name}!",
            "membership": OrganizationMembershipSerializer(membership).data,
            "redirect_url": "/dashboard/recruiter"
        }, status=status.HTTP_200_OK)


class OrganizationPermissionsCatalogView(views.APIView):
    """
    GET /api/organizations/permissions-catalog/
    Returns full list of available granular permission definitions for UI matrices.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        catalog = [
            {"code": code, "description": desc, "category": code.split('.')[0]}
            for code, desc in ALL_PERMISSIONS.items()
        ]
        return Response({
            "permissions": catalog,
            "predefined_roles": PREDEFINED_ROLES
        })


def request_has_perm(request, perm_code: str) -> bool:
    """
    Helper to verify whether the requesting user has permission within request.org.
    """
    if not request.user or not request.user.is_authenticated:
        return False
    if request.user.is_staff or request.user.is_superuser:
        return True
    if not hasattr(request, 'org') or not request.org:
        return False
    if request.org.owner_id == request.user.id:
        return True
    if hasattr(request, 'membership') and request.membership:
        return request.membership.has_permission(perm_code)
    membership = get_user_membership(request.user, request.org.id)
    return membership.has_permission(perm_code) if membership else False
