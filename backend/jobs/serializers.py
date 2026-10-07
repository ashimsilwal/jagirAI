from rest_framework import serializers
from .models import Job
from users.serializers import UserSerializer, RecruiterProfileSerializer


class JobSerializer(serializers.ModelSerializer):
    """
    Serializer for full Job details, creation, and updates.
    """
    recruiter = UserSerializer(read_only=True)
    company_name = serializers.SerializerMethodField()
    company_logo = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = (
            'id',
            'recruiter',
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
        read_only_fields = ('id', 'recruiter', 'created_at', 'updated_at')

    def get_company_name(self, obj):
        if hasattr(obj.recruiter, 'recruiter_profile') and obj.recruiter.recruiter_profile.company_name:
            return obj.recruiter.recruiter_profile.company_name
        return obj.recruiter.username

    def get_company_logo(self, obj):
        if hasattr(obj.recruiter, 'recruiter_profile') and obj.recruiter.recruiter_profile.company_logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.recruiter.recruiter_profile.company_logo.url)
            return obj.recruiter.recruiter_profile.company_logo.url
        return None

    def create(self, validated_data):
        # Automatically assign the authenticated recruiter
        request = self.context.get('request')
        validated_data['recruiter'] = request.user
        return super().create(validated_data)
