import os
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from .models import JobSeekerProfile, RecruiterProfile, SupportTicket
from jobs.models import JobCategory

User = get_user_model()


import re

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for returning user details safely (no password).
    """
    profile_picture = serializers.SerializerMethodField()
    is_org_owner = serializers.SerializerMethodField()
    org_permissions = serializers.SerializerMethodField()
    org_role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            'role',
            'is_staff',
            'is_superuser',
            'is_active',
            'date_joined',
            'is_profile_setup',
            'must_change_password',
            'is_org_owner',
            'org_permissions',
            'org_role',
            'profile_picture',
        )
        read_only_fields = ('id', 'date_joined', 'must_change_password', 'is_org_owner', 'org_permissions', 'org_role')

    def get_is_org_owner(self, obj):
        try:
            from organizations.models import Organization
            return Organization.objects.filter(owner=obj).exists()
        except Exception:
            return False

    def get_org_permissions(self, obj):
        try:
            if obj.is_staff or obj.is_superuser:
                from organizations.constants import ALL_PERMISSIONS
                return list(ALL_PERMISSIONS.keys())
            from organizations.services import get_or_create_user_organization, get_user_membership
            from organizations.constants import ALL_PERMISSIONS
            org = get_or_create_user_organization(obj)
            if org.owner_id == obj.id:
                return list(ALL_PERMISSIONS.keys())
            membership = get_user_membership(obj, org.id)
            if membership and membership.status == 'ACTIVE':
                return list(membership.get_effective_permissions())
            return []
        except Exception:
            return []

    def get_org_role(self, obj):
        try:
            if obj.is_staff or obj.is_superuser:
                return {'name': 'Administrator', 'slug': 'admin'}
            from organizations.services import get_or_create_user_organization, get_user_membership
            org = get_or_create_user_organization(obj)
            if org.owner_id == obj.id:
                return {'name': 'Organization Owner', 'slug': 'owner'}
            membership = get_user_membership(obj, org.id)
            if membership and membership.status == 'ACTIVE':
                return {'name': membership.role.name, 'slug': membership.role.slug}
            return None
        except Exception:
            return None

    def get_profile_picture(self, obj):
        try:
            if hasattr(obj, 'job_seeker_profile') and obj.job_seeker_profile.profile_picture:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.job_seeker_profile.profile_picture.url)
                return obj.job_seeker_profile.profile_picture.url
            elif hasattr(obj, 'recruiter_profile') and obj.recruiter_profile.company_logo:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.recruiter_profile.company_logo.url)
                return obj.recruiter_profile.company_logo.url
        except Exception:
            pass
        return None


class ChangeInitialPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    confirm_password = serializers.CharField(
        write_only=True,
        required=True
    )

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs



class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for registering a new user.
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    confirm_password = serializers.CharField(
        write_only=True,
        required=True
    )
    role = serializers.ChoiceField(
        choices=User.Role.choices,
        default=User.Role.JOB_SEEKER
    )

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'confirm_password', 'role')

    def validate_email(self, value):
        val = value.strip().lower()
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, val):
            raise serializers.ValidationError("Please provide a valid email address (e.g., name@domain.com).")
        if User.objects.filter(email__iexact=val).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return val

    def validate_username(self, value):
        val = value.strip()
        if len(val) < 3:
            raise serializers.ValidationError("Username must be at least 3 characters.")
        if not re.match(r'^[a-zA-Z0-9_.-]+$', val):
            raise serializers.ValidationError("Username may only contain letters, numbers, underscores, periods, and hyphens.")
        if User.objects.filter(username__iexact=val).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return val

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password'],
            role=validated_data.get('role', User.Role.JOB_SEEKER)
        )
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom login serializer returning JWT tokens and user metadata.
    """
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data


class LogoutSerializer(serializers.Serializer):
    """
    Serializer for logging out and blacklisting the refresh token.
    """
    refresh = serializers.CharField(required=True)

    def validate(self, attrs):
        self.token = attrs['refresh']
        return attrs

    def save(self, **kwargs):
        try:
            token = RefreshToken(self.token)
            token.blacklist()
        except Exception:
            raise serializers.ValidationError({"refresh": "Invalid or expired token."})


class JobCategorySummarySerializer(serializers.ModelSerializer):
    """
    Serializer for displaying category summary in seeker profile.
    """
    class Meta:
        model = JobCategory
        fields = ('id', 'name', 'slug', 'description')


class JobSeekerPreferencesSerializer(serializers.Serializer):
    """
    Serializer for validating and updating job seeker category preferences.
    """
    category_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True,
        default=list
    )

    def validate_category_ids(self, value):
        if not value:
            return []
        unique_ids = list(set(value))
        existing_ids = set(JobCategory.objects.filter(id__in=unique_ids).values_list('id', flat=True))
        invalid_ids = [cid for cid in unique_ids if cid not in existing_ids]
        if invalid_ids:
            raise serializers.ValidationError(f"Invalid category IDs: {invalid_ids}")
        return unique_ids


class JobSeekerProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for Job Seeker Profile.
    """
    user = UserSerializer(read_only=True)
    job_preferences = JobCategorySummarySerializer(many=True, read_only=True)

    class Meta:
        model = JobSeekerProfile
        fields = (
            'id',
            'user',
            'phone',
            'profile_picture',
            'bio',
            'resume',
            'skills',
            'education',
            'experience',
            'location',
            'job_preferences',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'user', 'job_preferences', 'created_at', 'updated_at')

    def validate_resume(self, value):
        if value and hasattr(value, 'name'):
            valid_extensions = ['.pdf', '.doc', '.docx']
            ext = os.path.splitext(value.name)[1].lower()
            if ext not in valid_extensions:
                raise serializers.ValidationError("Resume must be a PDF or Word document (.pdf, .doc, .docx).")
            # 5 MB maximum size
            if hasattr(value, 'size') and value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("Resume file size cannot exceed 5MB.")
        return value

    def validate_profile_picture(self, value):
        if value and hasattr(value, 'size'):
            # 2 MB maximum size
            if value.size > 2 * 1024 * 1024:
                raise serializers.ValidationError("Profile picture file size cannot exceed 2MB.")
            if hasattr(value, 'name'):
                ext = os.path.splitext(value.name)[1].lower()
                valid_image_extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
                if ext not in valid_image_extensions:
                    raise serializers.ValidationError("Profile picture must be an image file (.jpg, .jpeg, .png, .webp).")
        return value


class RecruiterProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for Recruiter Profile.
    """
    user = UserSerializer(read_only=True)

    class Meta:
        model = RecruiterProfile
        fields = (
            'id',
            'user',
            'company_name',
            'company_description',
            'company_logo',
            'company_website',
            'location',
            'phone',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')

    def validate_company_logo(self, value):
        if value:
            # 2 MB maximum size
            if value.size > 2 * 1024 * 1024:
                raise serializers.ValidationError("Company logo file size cannot exceed 2MB.")
        return value


class AdminUserListSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for admin user management with profile summary and entity counts.
    """
    profile_summary = serializers.SerializerMethodField()
    jobs_count = serializers.SerializerMethodField()
    applications_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            'role',
            'is_staff',
            'is_superuser',
            'is_active',
            'date_joined',
            'profile_summary',
            'jobs_count',
            'applications_count',
        )

    def get_profile_summary(self, obj):
        if obj.role == User.Role.JOB_SEEKER:
            profile = getattr(obj, 'job_seeker_profile', None)
            if profile:
                return {
                    'phone': profile.phone,
                    'location': profile.location,
                    'skills': profile.skills,
                    'resume': profile.resume.url if profile.resume else None,
                    'bio': profile.bio,
                }
        elif obj.role == User.Role.JOB_RECRUITER:
            profile = getattr(obj, 'recruiter_profile', None)
            if profile:
                return {
                    'company_name': profile.company_name,
                    'location': profile.location,
                    'phone': profile.phone,
                    'company_website': profile.company_website,
                    'company_description': profile.company_description,
                }
        return {}

    def get_jobs_count(self, obj):
        if obj.role == User.Role.JOB_RECRUITER:
            return getattr(obj, 'posted_jobs', []).count() if hasattr(obj, 'posted_jobs') else 0
        return 0

    def get_applications_count(self, obj):
        if obj.role == User.Role.JOB_SEEKER:
            return getattr(obj, 'applications', []).count() if hasattr(obj, 'applications') else 0
        return 0


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for admin to update user fields (status, role, staff, username, email).
    """
    class Meta:
        model = User
        fields = ('username', 'email', 'role', 'is_active', 'is_staff')

    def validate_email(self, value):
        user = self.instance
        if User.objects.filter(email__iexact=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate_username(self, value):
        user = self.instance
        if User.objects.filter(username__iexact=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value


class SupportTicketSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)
    resolved_by_username = serializers.CharField(source='resolved_by.username', read_only=True, default=None)

    class Meta:
        model = SupportTicket
        fields = (
            'id',
            'user',
            'user_email',
            'user_username',
            'user_role',
            'subject',
            'category',
            'priority',
            'message',
            'status',
            'admin_response',
            'resolved_by',
            'resolved_by_username',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'user', 'created_at', 'updated_at', 'resolved_by')


class SupportTicketCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicket
        fields = (
            'id',
            'subject',
            'category',
            'priority',
            'message',
            'status',
            'created_at',
        )
        read_only_fields = ('id', 'status', 'created_at')

    def create(self, validated_data):
        user = self.context['request'].user
        return SupportTicket.objects.create(user=user, **validated_data)


class AdminSupportTicketUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicket
        fields = ('status', 'admin_response')

    def update(self, instance, validated_data):
        request = self.context.get('request')
        instance.status = validated_data.get('status', instance.status)
        instance.admin_response = validated_data.get('admin_response', instance.admin_response)
        if request and request.user.is_authenticated:
            instance.resolved_by = request.user
        instance.save()
        return instance

