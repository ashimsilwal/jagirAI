from django.db.models import Q
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Job
from .serializers import JobSerializer
from .permissions import IsRecruiterOrReadOnly, IsJobOwner
from users.permissions import IsRecruiter


class JobViewSet(viewsets.ModelViewSet):
    """
    ViewSet for listing, retrieving, creating, updating, and deleting jobs.

    - Public/Job Seekers:
        - GET /api/jobs/ -> List of active jobs (Search & Filter supported)
        - GET /api/jobs/<id>/ -> Retrieve active job
    - Recruiters:
        - POST /api/jobs/ -> Create job
        - PUT/PATCH /api/jobs/<id>/ -> Update own job
        - DELETE /api/jobs/<id>/ -> Delete own job
        - GET /api/jobs/my-jobs/ -> View all jobs created by the authenticated recruiter
    """
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsRecruiterOrReadOnly, IsJobOwner]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'requirements', 'location']
    ordering_fields = ['created_at', 'deadline', 'title']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Job.objects.select_related('recruiter', 'recruiter__recruiter_profile').all()

        # If it's a detail action (retrieve/update/destroy), allow fetching
        if self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            return queryset

        # For list action, if not looking at my-jobs, only return ACTIVE jobs by default
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        else:
            queryset = queryset.filter(status=Job.JobStatus.ACTIVE)

        # Filter by employment_type if provided
        employment_type = self.request.query_params.get('employment_type')
        if employment_type:
            queryset = queryset.filter(employment_type=employment_type)

        # Filter by location if provided
        location = self.request.query_params.get('location')
        if location:
            queryset = queryset.filter(location__icontains=location)

        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        from organizations.services import get_or_create_user_organization
        from organizations.permissions import check_org_permission
        from rest_framework.exceptions import PermissionDenied

        user = self.request.user
        if not user or not user.is_authenticated:
            raise PermissionDenied("Authentication credentials were not provided.")

        org = get_or_create_user_organization(user)
        if not check_org_permission(user, org, 'vacancy.create'):
            raise PermissionDenied("You do not have permission to create vacancies in this organization.")

        serializer.save()


    @action(
        detail=False,
        methods=['get'],
        permission_classes=[permissions.IsAuthenticated, IsRecruiter],
        url_path='my-jobs'
    )
    def my_jobs(self, request):
        """
        Returns all jobs (DRAFT, ACTIVE, CLOSED) posted within the logged-in recruiter's organization.
        """
        from organizations.services import get_or_create_user_organization
        from organizations.permissions import check_org_permission
        from rest_framework.exceptions import PermissionDenied

        org = get_or_create_user_organization(request.user)
        if not check_org_permission(request.user, org, 'vacancy.view'):
            raise PermissionDenied("You do not have permission to view organization vacancies.")

        queryset = Job.objects.filter(
            Q(organization=org) | Q(recruiter=request.user)
        ).select_related(
            'recruiter', 'recruiter__recruiter_profile', 'organization'
        ).order_by('-created_at')

        # Optional filter by status within recruiter's own jobs
        status_param = request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)

        # Optional search within recruiter's own jobs
        search_param = request.query_params.get('search')
        if search_param:
            queryset = queryset.filter(
                Q(title__icontains=search_param) |
                Q(location__icontains=search_param)
            )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
