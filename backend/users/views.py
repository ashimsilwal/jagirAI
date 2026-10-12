import os
from django.db.models import Q
from rest_framework import generics, status, permissions, parsers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from jobs.models import Job
from applications.models import Application
from .models import JobSeekerProfile, RecruiterProfile, SupportTicket
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
    SupportTicketSerializer,
    SupportTicketCreateSerializer,
    AdminSupportTicketUpdateSerializer,
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
        user = User.objects.get(id=request.user.id)
        serializer = UserSerializer(user, context={'request': request})
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

    def perform_update(self, serializer):
        remove_picture = self.request.data.get('remove_profile_picture')
        if remove_picture in ['true', 'True', True, '1']:
            instance = serializer.instance
            if instance.profile_picture:
                instance.profile_picture.delete(save=False)
                instance.profile_picture = None
        serializer.save()


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


class ProfileSetupView(APIView):
    """
    Endpoint: POST /api/profile/setup/
    First-time onboarding endpoint for newly registered users.
    Mandatory parts:
      - Job Seeker: name/username, phone, skills, resume
      - Recruiter: company_name, phone, location
    Optional/Skippable parts:
      - Job Seeker: profile_picture, bio, education, experience, location
      - Recruiter: company_logo, company_website, company_description
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def post(self, request):
        user = request.user
        errors = {}

        if user.role == User.Role.JOB_SEEKER:
            profile, _ = JobSeekerProfile.objects.get_or_create(user=user)

            # Name / Username (Mandatory)
            new_username = request.data.get('username', '').strip()
            if not new_username:
                errors['username'] = ['Full name / username is required.']
            elif new_username != user.username and User.objects.filter(username__iexact=new_username).exclude(id=user.id).exists():
                errors['username'] = ['A user with this username already exists.']

            # Phone (Optional)
            phone = request.data.get('phone', '').strip()

            # Skills (Mandatory)
            skills = request.data.get('skills', '').strip()
            if not skills:
                errors['skills'] = ['Please provide your key skills (e.g. Python, React, Sales).']

            # Resume (Optional)
            resume_file = request.FILES.get('resume')
            if resume_file:
                ext = os.path.splitext(resume_file.name)[1].lower()
                if ext not in ['.pdf', '.doc', '.docx']:
                    errors['resume'] = ['Resume must be a PDF or Word document (.pdf, .doc, .docx).']
                elif resume_file.size > 5 * 1024 * 1024:
                    errors['resume'] = ['Resume file size cannot exceed 5MB.']

            # Optional Profile Picture
            profile_picture_file = request.FILES.get('profile_picture')
            if profile_picture_file:
                ext = os.path.splitext(profile_picture_file.name)[1].lower()
                if ext not in ['.jpg', '.jpeg', '.png', '.webp', '.gif']:
                    errors['profile_picture'] = ['Profile picture must be an image (.jpg, .jpeg, .png, .webp).']
                elif profile_picture_file.size > 2 * 1024 * 1024:
                    errors['profile_picture'] = ['Profile picture size cannot exceed 2MB.']

            if errors:
                return Response(errors, status=status.HTTP_400_BAD_REQUEST)

            # Save updates
            if new_username:
                user.username = new_username
            user.is_profile_setup = True
            user.save()

            profile.phone = phone
            profile.skills = skills
            if resume_file:
                profile.resume = resume_file
            if profile_picture_file:
                profile.profile_picture = profile_picture_file
            if 'bio' in request.data:
                profile.bio = request.data.get('bio', '')
            if 'location' in request.data:
                profile.location = request.data.get('location', '')
            if 'education' in request.data:
                profile.education = request.data.get('education', '')
            if 'experience' in request.data:
                profile.experience = request.data.get('experience', '')
            profile.save()

            return Response({
                'message': 'Profile setup completed successfully!',
                'user': UserSerializer(user, context={'request': request}).data,
                'profile': JobSeekerProfileSerializer(profile, context={'request': request}).data
            }, status=status.HTTP_200_OK)

        elif user.role == User.Role.JOB_RECRUITER:
            profile, _ = RecruiterProfile.objects.get_or_create(user=user)

            # Company Name (Mandatory)
            company_name = request.data.get('company_name', '').strip()
            if not company_name:
                errors['company_name'] = ['Company or Organization name is required.']

            # Phone (Optional)
            phone = request.data.get('phone', '').strip()

            # Location (Mandatory)
            location = request.data.get('location', '').strip()
            if not location:
                errors['location'] = ['Company headquarters or office location is required.']

            # Optional Contact Name / Username
            new_username = request.data.get('username', '').strip()
            if new_username and new_username != user.username and User.objects.filter(username__iexact=new_username).exclude(id=user.id).exists():
                errors['username'] = ['A user with this username already exists.']

            # Optional Company Logo
            logo_file = request.FILES.get('company_logo') or request.FILES.get('profile_picture')
            if logo_file:
                ext = os.path.splitext(logo_file.name)[1].lower()
                if ext not in ['.jpg', '.jpeg', '.png', '.webp', '.gif']:
                    errors['company_logo'] = ['Company logo must be an image file (.jpg, .jpeg, .png, .webp).']
                elif logo_file.size > 2 * 1024 * 1024:
                    errors['company_logo'] = ['Company logo size cannot exceed 2MB.']

            if errors:
                return Response(errors, status=status.HTTP_400_BAD_REQUEST)

            # Save updates
            if new_username:
                user.username = new_username
            user.is_profile_setup = True
            user.save()

            profile.company_name = company_name
            profile.phone = phone
            profile.location = location
            if logo_file:
                profile.company_logo = logo_file
            if 'company_website' in request.data:
                profile.company_website = request.data.get('company_website', '')
            if 'company_description' in request.data:
                profile.company_description = request.data.get('company_description', '')
            profile.save()

            return Response({
                'message': 'Recruiter company profile setup completed successfully!',
                'user': UserSerializer(user, context={'request': request}).data,
                'profile': RecruiterProfileSerializer(profile, context={'request': request}).data
            }, status=status.HTTP_200_OK)

        else:
            # Admins or other roles
            user.is_profile_setup = True
            user.save()
            return Response({
                'message': 'Profile setup completed!',
                'user': UserSerializer(user, context={'request': request}).data
            }, status=status.HTTP_200_OK)


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


class SupportTicketListCreateView(generics.ListCreateAPIView):
    """
    Endpoint: GET, POST /api/support/tickets/
    Allows job seekers and recruiters to view their own tickets or create a new support ticket.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SupportTicket.objects.filter(user=self.request.user).order_by('-created_at')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SupportTicketCreateSerializer
        return SupportTicketSerializer


class SupportTicketDetailView(generics.RetrieveAPIView):
    """
    Endpoint: GET /api/support/tickets/<id>/
    Allows job seekers and recruiters to view their specific ticket details.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SupportTicketSerializer

    def get_queryset(self):
        return SupportTicket.objects.filter(user=self.request.user)


class AdminSupportTicketListView(generics.ListAPIView):
    """
    Endpoint: GET /api/admin/tickets/
    Admin endpoint to view, search, and filter all support tickets across the platform.
    """
    serializer_class = SupportTicketSerializer
    permission_classes = [permissions.IsAuthenticated, IsSuperAdminUser]

    def get_queryset(self):
        queryset = SupportTicket.objects.all().select_related('user', 'resolved_by').order_by('-created_at')

        status_param = self.request.query_params.get('status', '').strip()
        if status_param and status_param in SupportTicket.Status.values:
            queryset = queryset.filter(status=status_param)

        priority_param = self.request.query_params.get('priority', '').strip()
        if priority_param and priority_param in SupportTicket.Priority.values:
            queryset = queryset.filter(priority=priority_param)

        category_param = self.request.query_params.get('category', '').strip()
        if category_param and category_param in SupportTicket.Category.values:
            queryset = queryset.filter(category=category_param)

        search = self.request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(subject__icontains=search) |
                Q(message__icontains=search) |
                Q(user__email__icontains=search) |
                Q(user__username__icontains=search)
            )

        return queryset


class AdminSupportTicketDetailView(generics.RetrieveUpdateAPIView):
    """
    Endpoint: GET, PATCH, PUT /api/admin/tickets/<id>/
    Admin endpoint to inspect ticket details and solve/update support tickets.
    """
    queryset = SupportTicket.objects.all().select_related('user', 'resolved_by')
    permission_classes = [permissions.IsAuthenticated, IsSuperAdminUser]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return AdminSupportTicketUpdateSerializer
        return SupportTicketSerializer

