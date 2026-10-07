from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    CustomTokenObtainPairView,
    LogoutView,
    CurrentUserView,
    JobSeekerProfileView,
    RecruiterProfileView,
)

urlpatterns = [
    # Auth Endpoints
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='auth_login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='auth_refresh'),
    path('auth/logout/', LogoutView.as_view(), name='auth_logout'),
    path('auth/me/', CurrentUserView.as_view(), name='auth_me'),

    # Profile Endpoints
    path('profile/job-seeker/', JobSeekerProfileView.as_view(), name='job_seeker_profile'),
    path('profile/recruiter/', RecruiterProfileView.as_view(), name='recruiter_profile'),
]
