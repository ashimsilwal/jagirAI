from django.db.models import Q, Case, When, Value, BooleanField
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Job, JobCategory, JobCategoryRequest
from .serializers import JobSerializer, JobCategorySerializer, JobCategoryRequestSerializer
from .permissions import IsRecruiterOrReadOnly, IsJobOwner
from users.permissions import IsRecruiter, IsSuperAdminUser


class JobCategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for listing, retrieving, creating, updating, and deleting standard job categories.
    - Public/Recruiter/Seeker: GET /api/job-categories/ (List all approved categories)
    - Admin only: POST, PUT/PATCH, DELETE /api/job-categories/ (Manage categories directly)
    """
    serializer_class = JobCategorySerializer
    pagination_class = None

    def get_queryset(self):
        from django.db.models import Count
        return JobCategory.objects.annotate(jobs_count=Count('jobs')).order_by('name')

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsSuperAdminUser()]


class JobCategoryRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for recruiter requests to add new job categories.
    - Recruiter:
        - POST /api/job-category-requests/ -> Request new category
        - GET /api/job-category-requests/ -> View own submitted requests
    - Admin:
        - GET /api/job-category-requests/ -> View all category requests
        - POST /api/job-category-requests/<id>/approve/ -> Approve and create category
        - POST /api/job-category-requests/<id>/reject/ -> Reject category request
    """
    serializer_class = JobCategoryRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = JobCategoryRequest.objects.select_related('requester', 'created_category')
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param.upper())

        if user.is_staff or user.is_superuser:
            return queryset.order_by('-created_at')
        return queryset.filter(requester=user).order_by('-created_at')

    def create(self, request, *args, **kwargs):
        if request.user.role != 'JOB_RECRUITER' and not request.user.is_staff and not request.user.is_superuser:
            return Response(
                {"detail": "Only recruiters can request new job categories."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsSuperAdminUser])
    def approve(self, request, pk=None):
        cat_request = self.get_object()
        if cat_request.status == JobCategoryRequest.RequestStatus.APPROVED:
            return Response(
                {
                    "detail": "This category request has already been approved.",
                    "category": JobCategorySerializer(cat_request.created_category).data
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        admin_notes = request.data.get('admin_notes', '').strip()
        cat_name = cat_request.name.strip()
        category = JobCategory.objects.filter(name__iexact=cat_name).first()
        if not category:
            category = JobCategory.objects.create(
                name=cat_name,
                description=cat_request.description
            )

        cat_request.status = JobCategoryRequest.RequestStatus.APPROVED
        cat_request.created_category = category
        if admin_notes:
            cat_request.admin_notes = admin_notes
        cat_request.save()

        return Response({
            "detail": f"Category '{category.name}' has been created and approved.",
            "request": JobCategoryRequestSerializer(cat_request, context={'request': request}).data,
            "category": JobCategorySerializer(category).data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsSuperAdminUser])
    def reject(self, request, pk=None):
        cat_request = self.get_object()
        admin_notes = request.data.get('admin_notes', '').strip()

        cat_request.status = JobCategoryRequest.RequestStatus.REJECTED
        if admin_notes:
            cat_request.admin_notes = admin_notes
        cat_request.save()

        return Response({
            "detail": f"Category request '{cat_request.name}' has been rejected.",
            "request": JobCategoryRequestSerializer(cat_request, context={'request': request}).data
        }, status=status.HTTP_200_OK)


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
        queryset = Job.objects.select_related(
            'recruiter',
            'recruiter__recruiter_profile',
            'category',
            'organization'
        ).all()

        user = self.request.user
        preferred_category_ids = []
        if user and user.is_authenticated and getattr(user, 'role', None) == 'JOB_SEEKER':
            if hasattr(user, 'job_seeker_profile'):
                preferred_category_ids = list(
                    user.job_seeker_profile.job_preferences.values_list('id', flat=True)
                )

        if preferred_category_ids:
            queryset = queryset.annotate(
                is_preferred=Case(
                    When(category_id__in=preferred_category_ids, then=Value(True)),
                    default=Value(False),
                    output_field=BooleanField()
                )
            )
        else:
            queryset = queryset.annotate(
                is_preferred=Value(False, output_field=BooleanField())
            )

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

        # Filter by category if provided
        category_param = self.request.query_params.get('category')
        if category_param:
            if category_param.isdigit():
                queryset = queryset.filter(category_id=int(category_param))
            else:
                queryset = queryset.filter(category__slug=category_param)

        return queryset

    def filter_queryset(self, queryset):
        filtered_qs = super().filter_queryset(queryset)
        user = self.request.user
        if user and user.is_authenticated and getattr(user, 'role', None) == 'JOB_SEEKER':
            if hasattr(user, 'job_seeker_profile') and user.job_seeker_profile.job_preferences.exists():
                current_ordering = list(filtered_qs.query.order_by)
                if not current_ordering:
                    current_ordering = ['-created_at']
                # Avoid duplicated is_preferred
                current_ordering = [col for col in current_ordering if col not in ['-is_preferred', 'is_preferred']]
                filtered_qs = filtered_qs.order_by('-is_preferred', *current_ordering)
        return filtered_qs

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

        from django.db.models import Count
        queryset = Job.objects.filter(
            Q(organization=org) | Q(recruiter=request.user)
        ).select_related(
            'recruiter', 'recruiter__recruiter_profile', 'organization', 'category'
        ).annotate(
            applications_count=Count('applications', distinct=True)
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
