from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    CustomTokenObtainPairView,
    LogoutView,
    CurrentUserView,
    JobSeekerProfileView,
    RecruiterProfileView,
    AdminStatsView,
    AdminUserListView,
    AdminUserDetailView,
    SupportTicketListCreateView,
    SupportTicketDetailView,
    AdminSupportTicketListView,
    AdminSupportTicketDetailView,
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

    # Support Ticket Endpoints (Job Seekers & Recruiters)
    path('support/tickets/', SupportTicketListCreateView.as_view(), name='support_tickets_list_create'),
    path('support/tickets/<int:pk>/', SupportTicketDetailView.as_view(), name='support_ticket_detail'),

    # Admin Management Endpoints
    path('admin/stats/', AdminStatsView.as_view(), name='admin_stats'),
    path('admin/users/', AdminUserListView.as_view(), name='admin_users_list'),
    path('admin/users/<int:pk>/', AdminUserDetailView.as_view(), name='admin_user_detail'),
    path('admin/tickets/', AdminSupportTicketListView.as_view(), name='admin_tickets_list'),
    path('admin/tickets/<int:pk>/', AdminSupportTicketDetailView.as_view(), name='admin_ticket_detail'),
]
