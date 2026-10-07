import os
from rest_framework import serializers
from .models import Application
from jobs.models import Job
from jobs.serializers import JobSerializer
from users.models import JobSeekerProfile
from users.serializers import UserSerializer, JobSeekerProfileSerializer


class ApplicationSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for Application representations.
    """
    job = JobSerializer(read_only=True)
    applicant = UserSerializer(read_only=True)
    applicant_profile = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = (
            'id',
            'job',
            'applicant',
            'applicant_profile',
            'resume',
            'cover_letter',
            'status',
            'applied_at',
            'updated_at',
        )
        read_only_fields = ('id', 'job', 'applicant', 'status', 'applied_at', 'updated_at')

    def get_applicant_profile(self, obj):
        if hasattr(obj.applicant, 'job_seeker_profile'):
            return JobSeekerProfileSerializer(obj.applicant.job_seeker_profile, context=self.context).data
        return None


class ApplicationCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating an application by a Job Seeker.
    """
    resume = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = Application
        fields = (
            'id',
            'job',
            'resume',
            'cover_letter',
            'status',
            'applied_at',
        )
        read_only_fields = ('id', 'status', 'applied_at')

    def validate_resume(self, value):
        if value:
            valid_extensions = ['.pdf', '.doc', '.docx']
            ext = os.path.splitext(value.name)[1].lower()
            if ext not in valid_extensions:
                raise serializers.ValidationError("Resume must be a PDF or Word document (.pdf, .doc, .docx).")
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("Resume file size cannot exceed 5MB.")
        return value

    def validate(self, attrs):
        request = self.context.get('request')
        job = attrs.get('job')
        user = request.user

        # 1. Ensure job is active
        if job and job.status != Job.JobStatus.ACTIVE:
            raise serializers.ValidationError({"job": "You can only apply to active job postings."})

        # 2. Prevent duplicate applications
        if job and Application.objects.filter(job=job, applicant=user).exists():
            raise serializers.ValidationError({"non_field_errors": ["You have already applied for this job."]})

        # 3. Check for resume
        resume = attrs.get('resume')
        if not resume:
            profile = JobSeekerProfile.objects.filter(user=user).first()
            if not (profile and profile.resume):
                raise serializers.ValidationError({
                    "resume": "Please upload a resume or add a resume to your Job Seeker profile before applying."
                })

        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['applicant'] = request.user
        # Fallback to profile resume if not explicitly uploaded
        if not validated_data.get('resume'):
            profile = JobSeekerProfile.objects.filter(user=request.user).first()
            if profile and profile.resume:
                validated_data['resume'] = profile.resume
        return super().create(validated_data)


class ApplicationStatusUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer used by recruiters to update application status.
    """
    class Meta:
        model = Application
        fields = ('id', 'status', 'updated_at')
        read_only_fields = ('id', 'updated_at')

    def validate_status(self, value):
        if value not in Application.ApplicationStatus.values:
            raise serializers.ValidationError(f"Invalid status. Choose from {Application.ApplicationStatus.values}")
        return value
