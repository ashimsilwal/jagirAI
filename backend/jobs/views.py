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

    @action(
        detail=False,
        methods=['get'],
        permission_classes=[permissions.IsAuthenticated, IsRecruiter],
        url_path='my-jobs'
    )
    def my_jobs(self, request):
        """
        Returns all jobs (DRAFT, ACTIVE, CLOSED) posted by the logged-in recruiter.
        """
        queryset = Job.objects.filter(recruiter=request.user).select_related(
            'recruiter', 'recruiter__recruiter_profile'
        ).order_by('-created_at')

        # Optional filter by status within recruiter's own jobs
        status_param = request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
