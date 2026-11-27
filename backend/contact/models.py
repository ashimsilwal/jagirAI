from django.db import models
from django.conf import settings


class ContactMessage(models.Model):
    class Category(models.TextChoices):
        GENERAL = 'GENERAL', 'General Inquiries'
        CANDIDATE = 'CANDIDATE', 'Candidate / Job Seeker Help'
        EMPLOYER = 'EMPLOYER', 'Employer & Recruiter Inquiries'
        BUG = 'BUG', 'Report an Issue / Technical'
        PARTNERSHIP = 'PARTNERSHIP', 'Partnership & Media'

    class Status(models.TextChoices):
        UNREAD = 'UNREAD', 'Unread'
        READ = 'READ', 'Read'
        RESOLVED = 'RESOLVED', 'Resolved'
        ARCHIVED = 'ARCHIVED', 'Archived'

    name = models.CharField(max_length=255, help_text="Full name of the sender")
    email = models.EmailField(max_length=255, help_text="Contact email address")
    phone = models.CharField(max_length=50, blank=True, help_text="Optional contact phone")
    category = models.CharField(
        max_length=50,
        choices=Category.choices,
        default=Category.GENERAL,
        help_text="Inquiry category"
    )
    subject = models.CharField(max_length=255, help_text="Subject or topic of inquiry")
    message = models.TextField(help_text="Detailed message text")

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.UNREAD,
        db_index=True
    )
    admin_notes = models.TextField(blank=True, help_text="Internal admin remarks or follow-up notes")
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='resolved_contacts'
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Contact Inquiry'
        verbose_name_plural = 'Contact Inquiries'

    def __str__(self):
        return f"[{self.get_status_display()}] {self.name} - {self.subject} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"

