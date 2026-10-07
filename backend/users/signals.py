from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, JobSeekerProfile, RecruiterProfile


@receiver(post_save, sender=User)
def create_or_save_user_profile(sender, instance, created, **kwargs):
    """
    Automatically create the appropriate profile upon user creation.
    """
    if created:
        if instance.role == User.Role.JOB_SEEKER:
            JobSeekerProfile.objects.get_or_create(user=instance)
        elif instance.role == User.Role.JOB_RECRUITER:
            RecruiterProfile.objects.get_or_create(user=instance)
