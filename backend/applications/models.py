from django.db import models
from django.conf import settings
from jobs.models import Job


class Application(models.Model):
    class ApplicationStatus(models.TextChoices):
        APPLIED = 'APPLIED', 'Applied'
        SHORTLISTED = 'SHORTLISTED', 'Shortlisted'
        INTERVIEW = 'INTERVIEW', 'Interview'
        REJECTED = 'REJECTED', 'Rejected'
        HIRED = 'HIRED', 'Hired'

    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name='applications'
    )
    applicant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='job_applications'
    )
    resume = models.FileField(
        upload_to='application_resumes/',
        blank=True,
        null=True,
        help_text="Custom resume for this application, or auto-filled from JobSeekerProfile"
    )
    cover_letter = models.TextField(blank=True)
    rejection_reason = models.TextField(
        blank=True,
        default='',
        help_text="Feedback or reason provided to the applicant if rejected."
    )
    status = models.CharField(
        max_length=20,
        choices=ApplicationStatus.choices,
        default=ApplicationStatus.APPLIED,
        db_index=True
    )
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Application'
        verbose_name_plural = 'Applications'
        ordering = ['-applied_at']
        constraints = [
            models.UniqueConstraint(
                fields=['job', 'applicant'],
                name='unique_job_application'
            )
        ]

    def __str__(self):
        return f"{self.applicant.email} -> {self.job.title} ({self.status})"


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        APPLICATION_STATUS = 'APPLICATION_STATUS', 'Application Status'
        APPLICATION_RECEIVED = 'APPLICATION_RECEIVED', 'Application Received'
        SYSTEM = 'SYSTEM', 'System'

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=50,
        choices=NotificationType.choices,
        default=NotificationType.APPLICATION_STATUS
    )
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications'
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification to {self.recipient.email}: {self.title} (read={self.is_read})"
