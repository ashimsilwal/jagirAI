from rest_framework import serializers
from .models import Job, JobCategory, JobCategoryRequest
from users.serializers import UserSerializer
from organizations.services import get_or_create_user_organization, log_activity
from organizations.models import OrganizationActivityLog


class JobCategorySerializer(serializers.ModelSerializer):
    """
    Serializer for standard Job Categories with automated slug creation.
    """
    jobs_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = JobCategory
        fields = ('id', 'name', 'slug', 'description', 'jobs_count')
        read_only_fields = ('id', 'slug', 'jobs_count')

    def create(self, validated_data):
        from django.utils.text import slugify
        name = validated_data.get('name', '').strip()
        existing = JobCategory.objects.filter(name__iexact=name).first()
        if existing:
            return existing

        base_slug = slugify(name) or 'category'
        slug = base_slug
        counter = 1
        while JobCategory.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        validated_data['slug'] = slug
        validated_data['name'] = name
        return super().create(validated_data)


class JobCategoryRequestSerializer(serializers.ModelSerializer):
    """
    Serializer for recruiter requests to add new job categories.
    """
    requester = UserSerializer(read_only=True)
    created_category = JobCategorySerializer(read_only=True)

    class Meta:
        model = JobCategoryRequest
        fields = (
            'id',
            'name',
            'description',
            'reason',
            'requester',
            'status',
            'admin_notes',
            'created_category',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'requester', 'status', 'created_category', 'created_at', 'updated_at')

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user:
            validated_data['requester'] = request.user
        return super().create(validated_data)


class JobSerializer(serializers.ModelSerializer):
    """
    Serializer for full Job details, creation, and updates with organization support.
    """
    recruiter = UserSerializer(read_only=True)
    organization_id = serializers.IntegerField(source='organization.id', read_only=True)
    organization_name = serializers.SerializerMethodField()
    organization_slug = serializers.CharField(source='organization.slug', read_only=True)
    company_name = serializers.SerializerMethodField()
    company_logo = serializers.SerializerMethodField()
    category = JobCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=JobCategory.objects.all(),
        source='category',
        write_only=True,
        required=False,
        allow_null=True
    )
    is_preferred = serializers.BooleanField(read_only=True, default=False)
    applications_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Job
        fields = (
            'id',
            'recruiter',
            'organization_id',
            'organization_name',
            'organization_slug',
            'company_name',
            'company_logo',
            'category',
            'category_id',
            'is_preferred',
            'applications_count',
            'title',
            'description',
            'requirements',
            'responsibilities',
            'location',
            'latitude',
            'longitude',
            'salary',
            'employment_type',
            'deadline',
            'status',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'recruiter', 'organization_id', 'organization_name', 'organization_slug', 'created_at', 'updated_at', 'is_preferred', 'applications_count')

    def get_organization_name(self, obj):
        if obj.organization:
            return obj.organization.name
        return self.get_company_name(obj)

    def get_company_name(self, obj):
        if obj.organization and obj.organization.name:
            return obj.organization.name
        if hasattr(obj.recruiter, 'recruiter_profile') and obj.recruiter.recruiter_profile.company_name:
            return obj.recruiter.recruiter_profile.company_name
        return obj.recruiter.username

    def get_company_logo(self, obj):
        request = self.context.get('request')
        # Check organization logo first
        if obj.organization and obj.organization.logo:
            if request:
                return request.build_absolute_uri(obj.organization.logo.url)
            return obj.organization.logo.url
        # Fallback to recruiter profile logo
        if hasattr(obj.recruiter, 'recruiter_profile') and obj.recruiter.recruiter_profile.company_logo:
            if request:
                return request.build_absolute_uri(obj.recruiter.recruiter_profile.company_logo.url)
            return obj.recruiter.recruiter_profile.company_logo.url
        return None

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['recruiter'] = request.user
        org = get_or_create_user_organization(request.user)
        validated_data['organization'] = org

        job = super().create(validated_data)

        log_activity(
            organization=org,
            actor=request.user,
            action=OrganizationActivityLog.Action.VACANCY_CREATED,
            target_type='Job',
            target_id=str(job.id),
            target_repr=f"{job.title} ({job.status})",
            metadata={'title': job.title, 'status': job.status, 'location': job.location}
        )

        return job

    def update(self, instance, validated_data):
        old_status = instance.status
        job = super().update(instance, validated_data)

        if old_status != job.status and job.organization:
            request = self.context.get('request')
            actor = request.user if request else None
            log_activity(
                organization=job.organization,
                actor=actor,
                action=OrganizationActivityLog.Action.VACANCY_STATUS_UPDATED,
                target_type='Job',
                target_id=str(job.id),
                target_repr=f"{job.title} ({job.status})",
                metadata={'previous_status': old_status, 'new_status': job.status}
            )

        return job
