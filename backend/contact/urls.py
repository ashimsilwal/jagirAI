from django.urls import path
from .views import (
    ContactSubmitView,
    AdminContactListView,
    AdminContactDetailView,
    AdminContactStatsView,
    AdminContactMarkAllReadView,
)

urlpatterns = [
    path('', ContactSubmitView.as_view(), name='contact_submit'),
    path('messages/', AdminContactListView.as_view(), name='admin_contact_list'),
    path('messages/<int:pk>/', AdminContactDetailView.as_view(), name='admin_contact_detail'),
    path('stats/', AdminContactStatsView.as_view(), name='admin_contact_stats'),
    path('mark-all-read/', AdminContactMarkAllReadView.as_view(), name='admin_contact_mark_all_read'),
]

