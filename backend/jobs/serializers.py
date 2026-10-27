from rest_framework import serializers
from .models import Job
from users.serializers import UserSerializer
from organizations.services import get_or_create_user_organization, log_activity
from organizations.models import OrganizationActivityLog


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
            'title',
            'description',
            'requirements',
            'responsibilities',
            'location',
            'salary',
            'employment_type',
            'deadline',
            'status',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'recruiter', 'organization_id', 'organization_name', 'organization_slug', 'created_at', 'updated_at')

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
