from django.contrib import admin
from .models import Job


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('title', 'recruiter', 'location', 'employment_type', 'status', 'created_at')
    list_filter = ('status', 'employment_type', 'created_at')
    search_fields = ('title', 'description', 'requirements', 'location', 'recruiter__email')
    readonly_fields = ('created_at', 'updated_at')
