from django.core.management.base import BaseCommand
from users.models import User, JobSeekerProfile, RecruiterProfile
from jobs.models import Job


class Command(BaseCommand):
    help = "Seeds initial test users, profiles, and sample job vacancies."

    def handle(self, *args, **options):
        # 1. Superadmin
        admin_user, _ = User.objects.get_or_create(
            email='admin@prorecruiter.com',
            defaults={
                'username': 'admin',
                'role': User.Role.JOB_RECRUITER,
                'is_staff': True,
                'is_superuser': True
            }
        )
        admin_user.set_password('AdminPassword123!')
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.save()
        self.stdout.write(self.style.SUCCESS("Superadmin: admin@prorecruiter.com / AdminPassword123!"))

        # 2. Recruiter
        recruiter_user, _ = User.objects.get_or_create(
            email='recruiter@techcorp.com',
            defaults={
                'username': 'techcorp_recruiter',
                'role': User.Role.JOB_RECRUITER
            }
        )
        recruiter_user.set_password('RecruiterPassword123!')
        recruiter_user.save()

        r_profile, _ = RecruiterProfile.objects.get_or_create(user=recruiter_user)
        r_profile.company_name = "TechCorp Global"
        r_profile.company_description = "Leading provider of AI and cloud enterprise solutions."
        r_profile.company_website = "https://techcorp.example.com"
        r_profile.location = "New York, NY"
        r_profile.phone = "+1 555-0100"
        r_profile.save()
        self.stdout.write(self.style.SUCCESS("Recruiter: recruiter@techcorp.com / RecruiterPassword123!"))

        # 3. Job Seeker
        seeker_user, _ = User.objects.get_or_create(
            email='john.seeker@example.com',
            defaults={
                'username': 'john_seeker',
                'role': User.Role.JOB_SEEKER
            }
        )
        seeker_user.set_password('SeekerPassword123!')
        seeker_user.save()

        s_profile, _ = JobSeekerProfile.objects.get_or_create(user=seeker_user)
        s_profile.bio = "Passionate Full Stack Engineer with 3+ years experience building web apps."
        s_profile.skills = "Python, Django, Next.js, React, TypeScript, PostgreSQL, Docker"
        s_profile.education = "B.S. in Software Engineering"
        s_profile.experience = "Full Stack Developer at Alpha Solutions (2023 - Present)"
        s_profile.location = "San Francisco, CA"
        s_profile.phone = "+1 555-0144"
        s_profile.save()
        self.stdout.write(self.style.SUCCESS("Job Seeker: john.seeker@example.com / SeekerPassword123!"))

        # 4. Sample Job Vacancy
        job, created = Job.objects.get_or_create(
            recruiter=recruiter_user,
            title="Senior Full-Stack Developer",
            defaults={
                'description': 'We are looking for a Senior Developer to build scalable full-stack applications.',
                'requirements': 'Proficiency in Python/Django, Next.js, and PostgreSQL.',
                'responsibilities': 'Develop REST APIs, architect frontend components, lead technical reviews.',
                'location': 'Remote / New York',
                'salary': 'Rs. 120,000 - Rs. 145,000',
                'employment_type': Job.EmploymentType.FULL_TIME,
                'status': Job.JobStatus.ACTIVE
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"Sample Job Created: {job.title}"))

        self.stdout.write(self.style.SUCCESS("Seeding completed successfully!"))
