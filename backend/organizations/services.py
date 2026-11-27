import hashlib
import secrets
from datetime import timedelta
from django.utils import timezone
from django.utils.text import slugify
from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.exceptions import ValidationError, PermissionDenied
from .models import (
    Organization,
    OrganizationRole,
    OrganizationMembership,
    OrganizationInvitation,
    OrganizationActivityLog,
)
from .constants import ALL_PERMISSIONS, PREDEFINED_ROLES


def ensure_predefined_roles():
    """
    Ensures system predefined roles exist in the database with their designated permissions.
    """
    for slug, data in PREDEFINED_ROLES.items():
        role, created = OrganizationRole.objects.get_or_create(
            organization__isnull=True,
            slug=slug,
            defaults={
                'name': data['name'],
                'slug': slug,
                'description': data['description'],
                'is_predefined': True,
                'permissions': data['permissions'],
            }
        )
        if not created:
            # Sync permissions if updated in constants
            if role.permissions != data['permissions'] or role.name != data['name']:
                role.permissions = data['permissions']
                role.name = data['name']
                role.description = data['description']
                role.is_predefined = True
                role.save()


def get_or_create_user_organization(user) -> Organization:
    """
    Retrieves the user's owned organization or active membership organization.
    If none exists for a recruiter, auto-provisions one using company_name or username.
    """
    ensure_predefined_roles()

    # 1. Check if user is a member of an organization (active or suspended)
    membership = OrganizationMembership.objects.filter(
        user=user
    ).select_related('organization', 'role').first()

    if membership:
        return membership.organization

    # 2. Check if user owns an organization
    owned = Organization.objects.filter(owner=user).first()
    if owned:
        owner_role = OrganizationRole.objects.filter(organization__isnull=True, slug='owner').first()
        OrganizationMembership.objects.get_or_create(
            organization=owned,
            user=user,
            defaults={
                'role': owner_role,
                'status': OrganizationMembership.Status.ACTIVE
            }
        )
        return owned

    # 3. Create an organization for the recruiter
    company_name = f"{user.username}'s Organization"
    company_desc = ""
    company_website = ""
    location = ""
    phone = ""

    if hasattr(user, 'recruiter_profile') and user.recruiter_profile:
        rp = user.recruiter_profile
        if rp.company_name:
            company_name = rp.company_name
        company_desc = rp.company_description or ""
        company_website = rp.company_website or ""
        location = rp.location or ""
        phone = rp.phone or ""

    base_slug = slugify(company_name) or f"org-{user.id}"
    slug = base_slug
    counter = 1
    while Organization.objects.filter(slug=slug).exists():
        slug = f"{base_slug}-{counter}"
        counter += 1

    with transaction.atomic():
        org = Organization.objects.create(
            name=company_name,
            slug=slug,
            description=company_desc,
            website=company_website,
            location=location,
            phone=phone,
            owner=user,
        )

        owner_role = OrganizationRole.objects.filter(organization__isnull=True, slug='owner').first()
        OrganizationMembership.objects.create(
            organization=org,
            user=user,
            role=owner_role,
            status=OrganizationMembership.Status.ACTIVE
        )

        log_activity(
            organization=org,
            actor=user,
            action=OrganizationActivityLog.Action.ORG_UPDATED,
            target_type='Organization',
            target_id=str(org.id),
            target_repr=org.name,
            metadata={'event': 'Organization auto-provisioned'}
        )

    return org


def get_user_membership(user, organization_id=None):
    """
    Returns the active OrganizationMembership for the given user within an organization.
    If organization_id is not specified, returns their primary active membership.
    """
    if not user or not user.is_authenticated:
        return None

    qs = OrganizationMembership.objects.filter(
        user=user,
        status=OrganizationMembership.Status.ACTIVE
    ).select_related('organization', 'role')

    if organization_id:
        return qs.filter(organization_id=organization_id).first()

    return qs.first()


def log_activity(
    organization: Organization,
    actor,
    action: str,
    target_type: str = '',
    target_id: str = '',
    target_repr: str = '',
    metadata: dict = None,
    ip_address: str = None
):
    """
    Appends an audit log entry to the organization's activity history.
    """
    try:
        OrganizationActivityLog.objects.create(
            organization=organization,
            actor=actor if (actor and actor.is_authenticated) else None,
            action=action,
            target_type=target_type,
            target_id=str(target_id),
            target_repr=target_repr[:255] if target_repr else '',
            metadata=metadata or {},
            ip_address=ip_address
        )
    except Exception as exc:
        # Activity logging should never crash the primary business operation
        print(f"[ActivityLog Error]: {exc}")


def create_invitation(
    organization: Organization,
    email: str,
    role: OrganizationRole,
    custom_permissions: list = None,
    invited_by = None,
    expiry_days: int = 7
) -> tuple[OrganizationInvitation, str]:
    """
    Creates a single-use cryptographically secure invitation.
    Returns (invitation, raw_token).
    """
    email = email.strip().lower()

    # Check if already an active member
    from users.models import User
    existing_user = User.objects.filter(email=email).first()
    if existing_user:
        active_member = OrganizationMembership.objects.filter(
            organization=organization,
            user=existing_user,
            status=OrganizationMembership.Status.ACTIVE
        ).exists()
        if active_member:
            raise ValidationError({"email": f"{email} is already an active member of this organization."})

    # Check for duplicate pending invitation
    existing_inv = OrganizationInvitation.objects.filter(
        organization=organization,
        email=email,
        status=OrganizationInvitation.Status.PENDING,
        expires_at__gt=timezone.now()
    ).first()

    if existing_inv:
        raise ValidationError({"email": f"An active invitation has already been sent to {email}. You can resend or revoke it."})

    # Generate cryptographically secure token and SHA-256 hash
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()

    expires_at = timezone.now() + timedelta(days=expiry_days)

    with transaction.atomic():
        invitation = OrganizationInvitation.objects.create(
            organization=organization,
            email=email,
            role=role,
            custom_permissions=custom_permissions or [],
            token_hash=token_hash,
            invited_by=invited_by,
            expires_at=expires_at,
            status=OrganizationInvitation.Status.PENDING
        )

        log_activity(
            organization=organization,
            actor=invited_by,
            action=OrganizationActivityLog.Action.MEMBER_INVITED,
            target_type='Invitation',
            target_id=str(invitation.id),
            target_repr=f"Invitation to {email} as {role.name}",
            metadata={'email': email, 'role': role.name, 'role_slug': role.slug}
        )

    # Send invitation email
    invite_url = f"http://localhost:3000/invite/accept?token={raw_token}"
    subject = f"You have been invited to join {organization.name} on Jagir AI"
    inviter_name = invited_by.username if invited_by else "Team Administrator"
    message = (
        f"Hello,\n\n"
        f"{inviter_name} has invited you to join the recruitment team at {organization.name} on Jagir AI "
        f"as '{role.name}'.\n\n"
        f"Click the link below to accept the invitation and configure your team access:\n"
        f"{invite_url}\n\n"
        f"This invitation link will expire in {expiry_days} days.\n\n"
        f"Best regards,\n"
        f"The Jagir AI Team"
    )

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@jagir.ai'),
            recipient_list=[email],
            fail_silently=True,
        )
    except Exception as exc:
        print(f"[Invitation Email Error]: {exc}")

    return invitation, raw_token


def validate_invitation(raw_token: str) -> OrganizationInvitation:
    """
    Validates an invitation by raw token.
    Raises ValidationError if invalid, revoked, or expired.
    """
    if not raw_token:
        raise ValidationError({"detail": "Invitation token is required."})

    token_hash = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()
    invitation = OrganizationInvitation.objects.filter(
        token_hash=token_hash
    ).select_related('organization', 'role', 'invited_by').first()

    if not invitation:
        raise ValidationError({"detail": "This invitation link is invalid or has expired."})

    if invitation.status == OrganizationInvitation.Status.REVOKED:
        raise ValidationError({"detail": "This invitation has been revoked by the organization administrator."})

    if invitation.status == OrganizationInvitation.Status.ACCEPTED:
        raise ValidationError({"detail": "This invitation has already been accepted."})

    if invitation.expires_at <= timezone.now():
        invitation.status = OrganizationInvitation.Status.EXPIRED
        invitation.save(update_fields=['status'])
        raise ValidationError({"detail": "This invitation link has expired."})

    return invitation


def accept_invitation(raw_token: str, user) -> OrganizationMembership:
    """
    Accepts an invitation transactionally.
    Associates the user with the organization, assigns the authorized role and permissions,
    marks invitation accepted, and records the audit log.
    """
    invitation = validate_invitation(raw_token)

    # Check email match
    if user.email.lower() != invitation.email.lower():
        raise PermissionDenied(
            f"This invitation was sent to {invitation.email}. You are currently logged in as {user.email}. "
            f"Please log in with the correct account or register using {invitation.email}."
        )

    with transaction.atomic():
        # Check if already has a membership (reactivate if suspended/left, or create)
        membership, created = OrganizationMembership.objects.get_or_create(
            organization=invitation.organization,
            user=user,
            defaults={
                'role': invitation.role,
                'custom_permissions': invitation.custom_permissions,
                'status': OrganizationMembership.Status.ACTIVE,
            }
        )

        if not created:
            membership.role = invitation.role
            membership.custom_permissions = invitation.custom_permissions
            membership.status = OrganizationMembership.Status.ACTIVE
            membership.save()

        # Update user role to JOB_RECRUITER if they were not already, so they can access recruiter views
        if user.role != 'JOB_RECRUITER':
            user.role = 'JOB_RECRUITER'
            user.save(update_fields=['role'])

        # Mark invitation accepted
        invitation.status = OrganizationInvitation.Status.ACCEPTED
        invitation.accepted_at = timezone.now()
        invitation.accepted_by = user
        invitation.save(update_fields=['status', 'accepted_at', 'accepted_by'])

        # Log activity
        log_activity(
            organization=invitation.organization,
            actor=user,
            action=OrganizationActivityLog.Action.INVITATION_ACCEPTED,
            target_type='Membership',
            target_id=str(membership.id),
            target_repr=f"{user.email} joined as {invitation.role.name}",
            metadata={
                'email': user.email,
                'role': invitation.role.name,
                'role_slug': invitation.role.slug,
            }
        )

    return membership


def generate_one_time_password(length=10) -> str:
    """
    Generates a secure, human-friendly one-time temporary password.
    Contains uppercase, lowercase, numbers, and special characters.
    """
    alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*"
    chars = [
        secrets.choice("ABCDEFGHJKLMNPQRSTUVWXYZ"),
        secrets.choice("abcdefghjkmnpqrstuvwxyz"),
        secrets.choice("23456789"),
        secrets.choice("!@#$%&*"),
    ]
    chars += [secrets.choice(alphabet) for _ in range(max(length - len(chars), 4))]
    secrets.SystemRandom().shuffle(chars)
    return "".join(chars)


def create_organization_member(
    organization: Organization,
    full_name: str,
    email: str,
    role: OrganizationRole,
    password: str = None,
    custom_permissions: list = None,
    created_by = None,
    username: str = None
) -> tuple[OrganizationMembership, str]:
    """
    Directly provisions a new user account with a secure one-time password (OTP),
    associates it with the organization, sets must_change_password = True,
    and establishes an active OrganizationMembership with the assigned role & permissions.
    """
    from users.models import User, RecruiterProfile
    from django.contrib.auth.password_validation import validate_password

    email = email.strip().lower()
    full_name = full_name.strip()

    if not email:
        raise ValidationError({"email": "Email address is required."})

    if not full_name:
        raise ValidationError({"full_name": "Full name is required."})

    # Check whether the email is already registered
    if User.objects.filter(email__iexact=email).exists():
        raise ValidationError({
            "email": "An account with this email address already exists. Duplicate user accounts are not permitted."
        })

    # Generate or validate one-time password
    one_time_password = password or generate_one_time_password(10)
    try:
        validate_password(one_time_password)
    except Exception as exc:
        err_msgs = list(exc.messages) if hasattr(exc, 'messages') else [str(exc)]
        raise ValidationError({"password": err_msgs})

    # Generate a unique, clean username
    if not username:
        base_username = slugify(full_name).replace('-', '_')
        if not base_username:
            base_username = slugify(email.split('@')[0]).replace('-', '_')
        if not base_username:
            base_username = f"user_{secrets.token_hex(4)}"

        username_candidate = base_username[:140]
        counter = 1
        while User.objects.filter(username__iexact=username_candidate).exists():
            username_candidate = f"{base_username[:130]}_{counter}"
            counter += 1
        username = username_candidate

    with transaction.atomic():
        # Create user account with hashed password and must_change_password flag
        new_user = User.objects.create_user(
            email=email,
            username=username,
            password=one_time_password,
            role=User.Role.JOB_RECRUITER,
            is_active=True,
            is_profile_setup=True,
        )
        new_user.must_change_password = True
        new_user.save(update_fields=['must_change_password'])

        # Ensure a recruiter profile exists for company association
        # Fall back to organization's logo if recruiter profile has none
        RecruiterProfile.objects.get_or_create(
            user=new_user,
            defaults={
                'company_name': organization.name,
                'company_description': organization.description or '',
                'company_logo': organization.logo if organization.logo else None,
                'location': organization.location or '',
                'phone': organization.phone or '',
            }
        )

        # Create organization membership
        membership = OrganizationMembership.objects.create(
            organization=organization,
            user=new_user,
            role=role,
            custom_permissions=custom_permissions or [],
            status=OrganizationMembership.Status.ACTIVE,
        )

        # Record security audit log
        log_activity(
            organization=organization,
            actor=created_by,
            action=OrganizationActivityLog.Action.MEMBER_CREATED,
            target_type='User',
            target_id=str(new_user.id),
            target_repr=f"{full_name} ({email}) as {role.name}",
            metadata={
                'email': email,
                'full_name': full_name,
                'username': username,
                'role': role.name,
                'role_slug': role.slug,
                'one_time_password_generated': True,
                'custom_permissions': custom_permissions or []
            }
        )

    return membership, one_time_password



def reset_member_password(
    membership: OrganizationMembership,
    new_password: str,
    actor = None
):
    """
    Directly sets a new password for an organization team member.
    Validates password complexity, securely hashes, and writes an audit log.
    """
    from django.contrib.auth.password_validation import validate_password

    # Validate new password
    try:
        validate_password(new_password)
    except Exception as exc:
        err_msgs = list(exc.messages) if hasattr(exc, 'messages') else [str(exc)]
        raise ValidationError({"password": err_msgs})

    # Safety: Cannot reset owner's password unless actor is the owner themselves
    if membership.organization.owner_id == membership.user_id and actor and actor.id != membership.user_id:
        raise PermissionDenied("You cannot reset the organization owner's password.")

    # Securely set and hash the password
    membership.user.set_password(new_password)
    membership.user.save(update_fields=['password'])

    # Record security audit log
    log_activity(
        organization=membership.organization,
        actor=actor,
        action=OrganizationActivityLog.Action.MEMBER_PASSWORD_RESET,
        target_type='User',
        target_id=str(membership.user_id),
        target_repr=f"Password reset for {membership.user.email}",
        metadata={'target_user_id': membership.user_id}
    )

