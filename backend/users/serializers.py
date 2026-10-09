import os
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from .models import JobSeekerProfile, RecruiterProfile, SupportTicket

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for returning user details safely (no password).
    """
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'is_staff', 'is_superuser', 'is_active', 'date_joined')
        read_only_fields = ('id', 'date_joined')


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
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

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


class JobSeekerProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for Job Seeker Profile.
    """
    user = UserSerializer(read_only=True)

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
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')

    def validate_resume(self, value):
        if value:
            valid_extensions = ['.pdf', '.doc', '.docx']
            ext = os.path.splitext(value.name)[1].lower()
            if ext not in valid_extensions:
                raise serializers.ValidationError("Resume must be a PDF or Word document (.pdf, .doc, .docx).")
            # 5 MB maximum size
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("Resume file size cannot exceed 5MB.")
        return value

    def validate_profile_picture(self, value):
        if value:
            # 2 MB maximum size
            if value.size > 2 * 1024 * 1024:
                raise serializers.ValidationError("Profile picture file size cannot exceed 2MB.")
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

