from rest_framework import serializers
from .models import (
    Organization,
    OrganizationRole,
    OrganizationMembership,
    OrganizationInvitation,
    OrganizationActivityLog,
)
from .constants import ALL_PERMISSIONS
from users.serializers import UserSerializer


class OrganizationSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    members_count = serializers.SerializerMethodField()
    open_vacancies_count = serializers.SerializerMethodField()
    logo = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = [
            'id',
            'name',
            'slug',
            'description',
            'logo',
            'website',
            'location',
            'phone',
            'owner',
            'members_count',
            'open_vacancies_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'slug', 'owner', 'created_at', 'updated_at']

    def get_logo(self, obj):
        request = self.context.get('request')
        try:
            if obj.logo:
                return request.build_absolute_uri(obj.logo.url) if request else obj.logo.url
            if hasattr(obj.owner, 'recruiter_profile') and obj.owner.recruiter_profile.company_logo:
                logo_url = obj.owner.recruiter_profile.company_logo.url
                return request.build_absolute_uri(logo_url) if request else logo_url
        except Exception:
            pass
        return None

    def get_members_count(self, obj):
        return obj.memberships.filter(status='ACTIVE').count()

    def get_open_vacancies_count(self, obj):
        return obj.jobs.filter(status='ACTIVE').count()


class OrganizationRoleSerializer(serializers.ModelSerializer):
    permissions_display = serializers.SerializerMethodField()

    class Meta:
        model = OrganizationRole
        fields = [
            'id',
            'organization',
            'name',
            'slug',
            'description',
            'is_predefined',
            'permissions',
            'permissions_display',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'is_predefined', 'created_at', 'updated_at']

    def get_permissions_display(self, obj):
        perms = obj.permissions or []
        return [
            {"code": code, "description": ALL_PERMISSIONS.get(code, code)}
            for code in perms
        ]

    def validate_permissions(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Permissions must be a list of permission codes.")
        for code in value:
            if code not in ALL_PERMISSIONS:
                raise serializers.ValidationError(f"Invalid permission code: '{code}'.")
        return value


class OrganizationMembershipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    role = OrganizationRoleSerializer(read_only=True)
    role_id = serializers.PrimaryKeyRelatedField(
        queryset=OrganizationRole.objects.all(),
        source='role',
        write_only=True,
        required=False
    )
    effective_permissions = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = OrganizationMembership
        fields = [
            'id',
            'organization',
            'user',
            'role',
            'role_id',
            'custom_permissions',
            'status',
            'joined_at',
            'updated_at',
            'effective_permissions',
            'is_owner',
        ]
        read_only_fields = ['id', 'organization', 'user', 'joined_at', 'updated_at']

    def get_effective_permissions(self, obj):
        return sorted(list(obj.get_effective_permissions()))

    def get_is_owner(self, obj):
        return obj.organization.owner_id == obj.user_id or obj.role.slug == 'owner'


class MemberUpdateSerializer(serializers.ModelSerializer):
    role_id = serializers.IntegerField(required=False)

    class Meta:
        model = OrganizationMembership
        fields = ['role_id', 'custom_permissions', 'status']

    def validate_status(self, value):
        if value not in [OrganizationMembership.Status.ACTIVE, OrganizationMembership.Status.SUSPENDED]:
            raise serializers.ValidationError("Status can only be set to ACTIVE or SUSPENDED.")
        return value

    def validate_custom_permissions(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Custom permissions must be a list.")
        for code in value:
            if code not in ALL_PERMISSIONS:
                raise serializers.ValidationError(f"Invalid permission: '{code}'.")
        return value


class CreateMemberSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150, required=True, trim_whitespace=True)
    email = serializers.EmailField(required=True)
    role_id = serializers.IntegerField(required=True)
    custom_permissions = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list
    )

    def validate_full_name(self, value):
        val = value.strip()
        if len(val) < 2:
            raise serializers.ValidationError("Full name must be at least 2 characters.")
        return val

    def validate_email(self, value):
        import re
        val = value.strip().lower()
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, val):
            raise serializers.ValidationError("Please enter a valid work email address (e.g., name@company.com).")
        from users.models import User
        if User.objects.filter(email__iexact=val).exists():
            raise serializers.ValidationError("An account with this email address already exists. Duplicate user accounts are not permitted.")
        return val

    def validate_custom_permissions(self, value):
        for code in value:
            if code not in ALL_PERMISSIONS:
                raise serializers.ValidationError(f"Invalid permission code: '{code}'.")
        return value


class ResetMemberPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, required=True, min_length=8)

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs



class OrganizationInvitationSerializer(serializers.ModelSerializer):
    role = OrganizationRoleSerializer(read_only=True)
    invited_by_username = serializers.CharField(source='invited_by.username', read_only=True)
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = OrganizationInvitation
        fields = [
            'id',
            'organization',
            'email',
            'role',
            'custom_permissions',
            'status',
            'invited_by_username',
            'expires_at',
            'created_at',
            'accepted_at',
            'is_expired',
        ]
        read_only_fields = fields

    def get_is_expired(self, obj):
        from django.utils import timezone
        return obj.expires_at <= timezone.now()


class CreateInvitationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role_id = serializers.IntegerField()
    custom_permissions = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list
    )
    expiry_days = serializers.IntegerField(default=7, min_value=1, max_value=30)

    def validate_custom_permissions(self, value):
        for code in value:
            if code not in ALL_PERMISSIONS:
                raise serializers.ValidationError(f"Invalid permission code: '{code}'.")
        return value


class ValidateInvitationSerializer(serializers.Serializer):
    token = serializers.CharField()


class OrganizationActivityLogSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source='actor.username', read_only=True, default='System')
    actor_email = serializers.CharField(source='actor.email', read_only=True, default='System')

    class Meta:
        model = OrganizationActivityLog
        fields = [
            'id',
            'organization',
            'actor_username',
            'actor_email',
            'action',
            'target_type',
            'target_id',
            'target_repr',
            'metadata',
            'ip_address',
            'created_at',
        ]
        read_only_fields = fields
