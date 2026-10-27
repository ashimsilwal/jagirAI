from django.urls import path
from .views import (
    OrganizationDetailView,
    OrganizationMembersListView,
    OrganizationMemberDetailView,
    OrganizationMemberResetPasswordView,
    OrganizationInvitationListCreateView,
    OrganizationInvitationRevokeView,
    OrganizationInvitationResendView,
    OrganizationRoleListCreateView,
    OrganizationRoleDetailView,
    OrganizationActivityLogListView,
    PublicInvitationValidateView,
    PublicInvitationAcceptView,
    OrganizationPermissionsCatalogView,
)

urlpatterns = [
    # Organization Profile
    path('current/', OrganizationDetailView.as_view(), name='org_detail'),

    # Members Management
    path('members/', OrganizationMembersListView.as_view(), name='org_members_list'),
    path('members/<int:pk>/', OrganizationMemberDetailView.as_view(), name='org_member_detail'),
    path('members/<int:pk>/reset_password/', OrganizationMemberResetPasswordView.as_view(), name='org_member_reset_password'),

    # Invitations
    path('invitations/', OrganizationInvitationListCreateView.as_view(), name='org_invitations_list_create'),
    path('invitations/<int:pk>/revoke/', OrganizationInvitationRevokeView.as_view(), name='org_invitation_revoke'),
    path('invitations/<int:pk>/resend/', OrganizationInvitationResendView.as_view(), name='org_invitation_resend'),

    # Public Invitation Acceptance flow
    path('public-invite/validate/', PublicInvitationValidateView.as_view(), name='org_public_invite_validate'),
    path('public-invite/accept/', PublicInvitationAcceptView.as_view(), name='org_public_invite_accept'),

    # Roles and Permissions
    path('roles/', OrganizationRoleListCreateView.as_view(), name='org_roles_list_create'),
    path('roles/<int:pk>/', OrganizationRoleDetailView.as_view(), name='org_role_detail'),
    path('permissions-catalog/', OrganizationPermissionsCatalogView.as_view(), name='org_permissions_catalog'),

    # Activity Audit Log
    path('activity/', OrganizationActivityLogListView.as_view(), name='org_activity_log'),
]
