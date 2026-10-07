from rest_framework import generics, status, permissions, parsers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .models import JobSeekerProfile, RecruiterProfile
from .permissions import IsJobSeeker, IsRecruiter
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    CustomTokenObtainPairSerializer,
    LogoutSerializer,
    JobSeekerProfileSerializer,
    RecruiterProfileSerializer,
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
