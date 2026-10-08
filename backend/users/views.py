from django.db.models import Q
from rest_framework import generics, status, permissions, parsers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from jobs.models import Job
from applications.models import Application
from .models import JobSeekerProfile, RecruiterProfile
from .permissions import IsJobSeeker, IsRecruiter, IsSuperAdminUser
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    CustomTokenObtainPairSerializer,
    LogoutSerializer,
    JobSeekerProfileSerializer,
    RecruiterProfileSerializer,
    AdminUserListSerializer,
    AdminUserUpdateSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    Endpoint: POST /api/auth/register/
    Registers a new user (JOB_SEEKER or JOB_RECRUITER).
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user_data = UserSerializer(user).data
        return Response(
            {
                "message": "User registered successfully.",
                "user": user_data
            },
            status=status.HTTP_201_CREATED
        )


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Endpoint: POST /api/auth/login/
    Takes email and password, returns access token, refresh token, and user info.
    """
    serializer_class = CustomTokenObtainPairSerializer


class LogoutView(APIView):
    """
    Endpoint: POST /api/auth/logout/
    Blacklists the refresh token to invalidate the session.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"message": "Logged out successfully."},
            status=status.HTTP_200_OK
        )


class CurrentUserView(APIView):
    """
    Endpoint: GET /api/auth/me/
    Returns currently authenticated user profile.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class JobSeekerProfileView(generics.RetrieveUpdateAPIView):
    """
    Endpoint: GET, PUT, PATCH /api/profile/job-seeker/
    Allows authenticated Job Seekers to view and update their profile.
    """
    serializer_class = JobSeekerProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsJobSeeker]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_object(self):
        profile, _ = JobSeekerProfile.objects.get_or_create(user=self.request.user)
        return profile


class RecruiterProfileView(generics.RetrieveUpdateAPIView):
    """
    Endpoint: GET, PUT, PATCH /api/profile/recruiter/
    Allows authenticated Recruiters to view and update their company profile.
    """
    serializer_class = RecruiterProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_object(self):
        profile, _ = RecruiterProfile.objects.get_or_create(user=self.request.user)
        return profile


class AdminStatsView(APIView):
    """
    Endpoint: GET /api/admin/stats/
    Provides platform overview metrics for administrators.
    """
    permission_classes = [permissions.IsAuthenticated, IsSuperAdminUser]

    def get(self, request):
        total_users = User.objects.count()
        job_seekers = User.objects.filter(role=User.Role.JOB_SEEKER).count()
        recruiters = User.objects.filter(role=User.Role.JOB_RECRUITER).count()
        active_users = User.objects.filter(is_active=True).count()
        inactive_users = User.objects.filter(is_active=False).count()
        staff_users = User.objects.filter(is_staff=True).count()
        total_jobs = Job.objects.count()
        active_jobs = Job.objects.filter(status='ACTIVE').count()
        total_applications = Application.objects.count()

        return Response({
            "total_users": total_users,
            "job_seekers": job_seekers,
            "recruiters": recruiters,
            "active_users": active_users,
            "inactive_users": inactive_users,
            "staff_users": staff_users,
            "total_jobs": total_jobs,
            "active_jobs": active_jobs,
            "total_applications": total_applications,
        }, status=status.HTTP_200_OK)


class AdminUserListView(generics.ListAPIView):
    """
    Endpoint: GET /api/admin/users/
    Admin endpoint to list, search, and filter all registered users.
    """
    serializer_class = AdminUserListSerializer
    permission_classes = [permissions.IsAuthenticated, IsSuperAdminUser]

    def get_queryset(self):
        queryset = User.objects.all().order_by('-date_joined')
        
        search = self.request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) | Q(email__icontains=search)
            )

        role = self.request.query_params.get('role', '').strip()
        if role in [User.Role.JOB_SEEKER, User.Role.JOB_RECRUITER]:
            queryset = queryset.filter(role=role)
        elif role == 'ADMIN':
            queryset = queryset.filter(is_staff=True)

        is_active = self.request.query_params.get('is_active', '').strip()
        if is_active.lower() == 'true':
            queryset = queryset.filter(is_active=True)
        elif is_active.lower() == 'false':
            queryset = queryset.filter(is_active=False)

        return queryset


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Endpoint: GET, PATCH, PUT, DELETE /api/admin/users/<id>/
    Allows admins to inspect, update status/role/details, or delete users.
    """
    queryset = User.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsSuperAdminUser]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return AdminUserUpdateSerializer
        return AdminUserListSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.id == request.user.id:
            return Response(
                {"detail": "You cannot delete your own admin account."},
                status=status.HTTP_400_BAD_REQUEST
            )
        self.perform_destroy(instance)
        return Response(
            {"detail": "User deleted successfully."},
            status=status.HTTP_200_OK
        )

