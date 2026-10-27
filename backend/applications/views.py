from django.db.models import Q
from rest_framework import viewsets, permissions, status, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Application
from jobs.models import Job
from .serializers import (
    ApplicationSerializer,
    ApplicationCreateSerializer,
    ApplicationStatusUpdateSerializer,
)
from .permissions import (
    CanApplyPermission,
    IsApplicationParticipant,
    IsRecruiterJobOwner,
)
from users.models import User
from users.permissions import IsJobSeeker, IsRecruiter


class ApplicationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling job applications.

    - Job Seekers:
        - POST /api/applications/ -> Apply to an active job
        - GET  /api/applications/my-applications/ -> View all applications submitted by self
    - Recruiters:
        - GET  /api/applications/job/<job_id>/ -> View all applications submitted to a specific job
        - PATCH /api/applications/<id>/status/ -> Update candidate status (SHORTLISTED, INTERVIEW, etc.)
    - Shared:
        - GET  /api/applications/<id>/ -> Retrieve single application (applicant or job owner)
    """
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Application.objects.none()

        # For object-level operations, check permissions explicitly on the full set
        if self.action in ['retrieve', 'update_status']:
            return Application.objects.select_related('job', 'applicant', 'job__recruiter')

        if user.is_staff or user.is_superuser:
            return Application.objects.all().select_related('job', 'applicant', 'job__recruiter')

        if user.role == User.Role.JOB_SEEKER:
            return Application.objects.filter(applicant=user).select_related('job', 'applicant', 'job__recruiter')

        if user.role == User.Role.JOB_RECRUITER:
            from organizations.services import get_or_create_user_organization, get_user_membership
            org = get_or_create_user_organization(user)
            membership = get_user_membership(user, org.id)
            if membership and not (org.owner_id == user.id or membership.has_permission('application.view')):
                return Application.objects.none()

            return Application.objects.filter(
                Q(job__organization=org) | Q(job__recruiter=user)
            ).select_related('job', 'applicant', 'job__recruiter', 'applicant__job_seeker_profile')

        return Application.objects.none()

    def get_serializer_class(self):
        if self.action == 'create':
            return ApplicationCreateSerializer
        if self.action == 'update_status':
            return ApplicationStatusUpdateSerializer
        return ApplicationSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated(), CanApplyPermission()]
        if self.action in ['retrieve']:
            return [permissions.IsAuthenticated(), IsApplicationParticipant()]
        if self.action == 'update_status':
            return [permissions.IsAuthenticated(), IsRecruiterJobOwner()]
        return [permissions.IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        application = serializer.save()
        output_serializer = ApplicationSerializer(application, context={'request': request})
        return Response(
            {
                "message": "Application submitted successfully.",
                "application": output_serializer.data
            },
            status=status.HTTP_201_CREATED
        )

    @action(
        detail=False,
        methods=['get'],
        permission_classes=[permissions.IsAuthenticated, IsJobSeeker],
        url_path='my-applications'
    )
    def my_applications(self, request):
        """
        Job seeker views all their own submitted applications.
        """
        queryset = Application.objects.filter(applicant=request.user).select_related(
            'job', 'applicant', 'job__recruiter', 'job__recruiter__recruiter_profile'
        ).order_by('-applied_at')

        status_param = request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)

        search_param = request.query_params.get('search')
        if search_param:
            queryset = queryset.filter(
                Q(job__title__icontains=search_param) |
                Q(job__location__icontains=search_param)
            )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = ApplicationSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)

        serializer = ApplicationSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(
        detail=False,
        methods=['get'],
        permission_classes=[permissions.IsAuthenticated, IsRecruiter],
        url_path='job/(?P<job_id>[^/.]+)'
    )
    def job_applications(self, request, job_id=None):
        """
        Recruiter or authorized organization member views applicants for a job.
        """
        job = get_object_or_404(Job, id=job_id)

        # Check if user owns job or has application.view in job's organization
        is_owner = job.recruiter == request.user or (job.organization and job.organization.owner_id == request.user.id)
        has_perm = False
        if job.organization:
            from organizations.services import get_user_membership
            m = get_user_membership(request.user, job.organization.id)
            if m and m.status == 'ACTIVE' and m.has_permission('application.view'):
                has_perm = True

        if not (is_owner or has_perm or request.user.is_staff or request.user.is_superuser):
            return Response(
                {"detail": "You do not have permission to view applicants for this job."},
                status=status.HTTP_403_FORBIDDEN
            )

        queryset = Application.objects.filter(job=job).select_related(
            'job', 'applicant', 'applicant__job_seeker_profile'
        ).order_by('-applied_at')

        # Optional filter by status
        status_param = request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)

        # Optional search by candidate name or email
        search_param = request.query_params.get('search')
        if search_param:
            queryset = queryset.filter(
                Q(applicant__username__icontains=search_param) |
                Q(applicant__email__icontains=search_param)
            )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = ApplicationSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)

        serializer = ApplicationSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(
        detail=True,
        methods=['patch'],
        permission_classes=[permissions.IsAuthenticated, IsRecruiterJobOwner],
        url_path='status'
    )
    def update_status(self, request, pk=None):
        """
        Recruiter updates the status of an application (e.g. SHORTLISTED, INTERVIEW, REJECTED, HIRED).
        """
        application = self.get_object()
        old_status = application.status
        serializer = ApplicationStatusUpdateSerializer(application, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Log activity if status changed
        if application.job.organization and old_status != application.status:
            from organizations.services import log_activity
            from organizations.models import OrganizationActivityLog
            log_activity(
                organization=application.job.organization,
                actor=request.user,
                action=OrganizationActivityLog.Action.APPLICATION_STATUS_UPDATED,
                target_type='Application',
                target_id=str(application.id),
                target_repr=f"{application.applicant.email} -> {application.job.title} ({application.status})",
                metadata={
                    'candidate_email': application.applicant.email,
                    'job_title': application.job.title,
                    'previous_status': old_status,
                    'new_status': application.status,
                }
            )

        output_serializer = ApplicationSerializer(application, context={'request': request})
        return Response(
            {
                "message": f"Application status updated to {application.status}.",
                "application": output_serializer.data
            },
            status=status.HTTP_200_OK
        )
