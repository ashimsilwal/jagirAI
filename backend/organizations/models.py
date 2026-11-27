from django.db import models
from django.conf import settings
from django.utils import timezone
from .constants import ALL_PERMISSIONS, PREDEFINED_ROLES


class Organization(models.Model):
    name = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(max_length=255, unique=True, db_index=True)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to='org_logos/', null=True, blank=True)
    website = models.URLField(max_length=255, blank=True)
    location = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='owned_organizations'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Organization'
        verbose_name_plural = 'Organizations'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} (Owner: {self.owner.email})"


class OrganizationRole(models.Model):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='roles',
        null=True,
        blank=True,
        help_text="Null for global system predefined roles; set for organization-specific custom roles."
    )
    name = models.CharField(max_length=100)
    slug = models.CharField(max_length=100, db_index=True)
    description = models.TextField(blank=True)
    is_predefined = models.BooleanField(default=False)
    permissions = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Organization Role'
        verbose_name_plural = 'Organization Roles'
        ordering = ['id']
        constraints = [
            models.UniqueConstraint(
                fields=['organization', 'slug'],
                name='unique_org_role_slug'
            )
        ]

    def __str__(self):
        scope = f"Org: {self.organization.name}" if self.organization else "System Predefined"
        return f"{self.name} ({scope})"


class OrganizationMembership(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        SUSPENDED = 'SUSPENDED', 'Suspended'
        LEFT = 'LEFT', 'Left'

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='memberships'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='organization_memberships'
    )
    role = models.ForeignKey(
        OrganizationRole,
        on_delete=models.PROTECT,
        related_name='memberships'
    )
    custom_permissions = models.JSONField(
        default=list,
        blank=True,
        help_text="Custom permissions assigned specifically to this member in addition to their role."
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Organization Membership'
        verbose_name_plural = 'Organization Memberships'
        ordering = ['-joined_at']
        constraints = [
            models.UniqueConstraint(
                fields=['organization', 'user'],
                name='unique_org_membership'
            )
        ]

    def __str__(self):
        return f"{self.user.email} - {self.role.name} at {self.organization.name} ({self.status})"

    def get_effective_permissions(self):
        """
        Returns the computed set of permissions for this member.
        If the member is the organization owner, they have ALL permissions.
        Otherwise, combine role permissions and custom permissions.
        """
        if self.status != self.Status.ACTIVE:
            return set()

        if self.organization.owner_id == self.user_id or self.role.slug == 'owner':
            return set(ALL_PERMISSIONS.keys())

        perms = set(self.role.permissions or [])
        if self.custom_permissions:
            perms.update(self.custom_permissions)
        return perms

    def has_permission(self, permission_code: str) -> bool:
        if self.status != self.Status.ACTIVE:
            return False
        return permission_code in self.get_effective_permissions()


class OrganizationInvitation(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        ACCEPTED = 'ACCEPTED', 'Accepted'
        REVOKED = 'REVOKED', 'Revoked'
        EXPIRED = 'EXPIRED', 'Expired'

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='invitations'
    )
    email = models.EmailField(db_index=True)
    role = models.ForeignKey(
        OrganizationRole,
        on_delete=models.PROTECT,
        related_name='invitations'
    )
    custom_permissions = models.JSONField(default=list, blank=True)
    token_hash = models.CharField(max_length=64, unique=True, db_index=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True
    )
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='sent_invitations'
    )
    expires_at = models.DateTimeField(db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    accepted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='accepted_invitations'
    )

    class Meta:
        verbose_name = 'Organization Invitation'
        verbose_name_plural = 'Organization Invitations'
        ordering = ['-created_at']

    def __str__(self):
        return f"Invite: {self.email} -> {self.organization.name} ({self.status})"

    def is_valid(self) -> bool:
        return self.status == self.Status.PENDING and self.expires_at > timezone.now()


class OrganizationActivityLog(models.Model):
    class Action(models.TextChoices):
        MEMBER_CREATED = 'MEMBER_CREATED', 'Member Created'
        MEMBER_PASSWORD_RESET = 'MEMBER_PASSWORD_RESET', 'Member Password Reset'
        MEMBER_INVITED = 'MEMBER_INVITED', 'Member Invited'
        INVITATION_ACCEPTED = 'INVITATION_ACCEPTED', 'Invitation Accepted'
        INVITATION_REVOKED = 'INVITATION_REVOKED', 'Invitation Revoked'
        INVITATION_RESENT = 'INVITATION_RESENT', 'Invitation Resent'
        MEMBER_REMOVED = 'MEMBER_REMOVED', 'Member Removed'
        MEMBER_SUSPENDED = 'MEMBER_SUSPENDED', 'Member Suspended'
        MEMBER_ACTIVATED = 'MEMBER_ACTIVATED', 'Member Activated'
        ROLE_ASSIGNED = 'ROLE_ASSIGNED', 'Role Assigned'
        ROLE_CREATED = 'ROLE_CREATED', 'Custom Role Created'
        ROLE_UPDATED = 'ROLE_UPDATED', 'Role Updated'
        ROLE_DELETED = 'ROLE_DELETED', 'Role Deleted'
        ORG_UPDATED = 'ORG_UPDATED', 'Organization Details Updated'
        VACANCY_CREATED = 'VACANCY_CREATED', 'Vacancy Created'
        VACANCY_STATUS_UPDATED = 'VACANCY_STATUS_UPDATED', 'Vacancy Status Updated'
        APPLICATION_STATUS_UPDATED = 'APPLICATION_STATUS_UPDATED', 'Application Status Updated'

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='activity_logs'
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='org_activities'
    )
    action = models.CharField(max_length=50, choices=Action.choices, db_index=True)
    target_type = models.CharField(max_length=50, blank=True)
    target_id = models.CharField(max_length=100, blank=True)
    target_repr = models.CharField(max_length=255, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = 'Organization Activity Log'
        verbose_name_plural = 'Organization Activity Logs'
        ordering = ['-created_at']

    def __str__(self):
        actor_name = self.actor.email if self.actor else "System"
        return f"[{self.created_at.strftime('%Y-%m-%d %H:%M')}] {actor_name}: {self.action} on {self.target_repr}"
