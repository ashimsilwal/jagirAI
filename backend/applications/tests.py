from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from jobs.models import Job
from applications.models import Application
from users.models import JobSeekerProfile

User = get_user_model()


class ApplicationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Recruiter 1
        self.recruiter1 = User.objects.create_user(
            email="recruiter1@company.com",
            username="recruiter1",
            password="Password123!",
            role=User.Role.JOB_RECRUITER
        )

        # Recruiter 2
        self.recruiter2 = User.objects.create_user(
            email="recruiter2@othercorp.com",
            username="recruiter2",
            password="Password123!",
            role=User.Role.JOB_RECRUITER
        )

        # Job Seeker 1
        self.seeker1 = User.objects.create_user(
            email="seeker1@example.com",
            username="seeker1",
            password="Password123!",
            role=User.Role.JOB_SEEKER
        )
        # Add profile resume for seeker 1
        profile1, _ = JobSeekerProfile.objects.get_or_create(user=self.seeker1)
        profile1.resume = SimpleUploadedFile("profile_resume.pdf", b"Seeker 1 profile resume", content_type="application/pdf")
        profile1.save()
        self.seeker1.refresh_from_db()

        # Job Seeker 2 (No profile resume)
        self.seeker2 = User.objects.create_user(
            email="seeker2@example.com",
            username="seeker2",
            password="Password123!",
            role=User.Role.JOB_SEEKER
        )

        # Active Job
        self.active_job = Job.objects.create(
            recruiter=self.recruiter1,
            title="Backend Developer",
            description="Build Django applications",
            location="Remote",
            status=Job.JobStatus.ACTIVE
        )

        # Closed Job
        self.closed_job = Job.objects.create(
            recruiter=self.recruiter1,
            title="Closed Position",
            description="Expired position",
            location="Remote",
            status=Job.JobStatus.CLOSED
        )

    def test_job_seeker_can_apply_with_profile_resume(self):
        self.client.force_authenticate(user=self.seeker1)
        payload = {
            "job": self.active_job.id,
            "cover_letter": "I am excited to apply for this backend position."
        }
        response = self.client.post('/api/applications/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['application']['status'], "APPLIED")
        self.assertTrue(Application.objects.filter(job=self.active_job, applicant=self.seeker1).exists())

    def test_job_seeker_can_apply_with_custom_uploaded_resume(self):
        self.client.force_authenticate(user=self.seeker2)
        custom_resume = SimpleUploadedFile("custom_cv.pdf", b"Custom CV Content", content_type="application/pdf")
        payload = {
            "job": self.active_job.id,
            "cover_letter": "Cover letter for custom application",
            "resume": custom_resume
        }
        response = self.client.post('/api/applications/', payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['application']['status'], "APPLIED")

    def test_duplicate_application_prevented(self):
        self.client.force_authenticate(user=self.seeker1)
        # First application
        self.client.post('/api/applications/', {"job": self.active_job.id}, format='json')
        # Duplicate application attempt
        response = self.client.post('/api/applications/', {"job": self.active_job.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_apply_to_closed_job(self):
        self.client.force_authenticate(user=self.seeker1)
        response = self.client.post('/api/applications/', {"job": self.closed_job.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("job", response.data)

    def test_recruiter_cannot_apply_to_job(self):
        self.client.force_authenticate(user=self.recruiter1)
        response = self.client.post('/api/applications/', {"job": self.active_job.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_job_seeker_my_applications(self):
        self.client.force_authenticate(user=self.seeker1)
        self.client.post('/api/applications/', {"job": self.active_job.id}, format='json')

        response = self.client.get('/api/applications/my-applications/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data['results'] if 'results' in response.data else response.data
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['job']['title'], "Backend Developer")

    def test_recruiter_job_applicants_and_status_update(self):
        # Seeker applies
        self.client.force_authenticate(user=self.seeker1)
        apply_res = self.client.post('/api/applications/', {"job": self.active_job.id}, format='json')
        app_id = apply_res.data['application']['id']

        # Recruiter 1 views applicants for this job
        self.client.force_authenticate(user=self.recruiter1)
        job_apps_res = self.client.get(f'/api/applications/job/{self.active_job.id}/')
        self.assertEqual(job_apps_res.status_code, status.HTTP_200_OK)
        data = job_apps_res.data['results'] if 'results' in job_apps_res.data else job_apps_res.data
        self.assertEqual(len(data), 1)

        # Recruiter 1 updates status to SHORTLISTED
        status_res = self.client.patch(
            f'/api/applications/{app_id}/status/',
            {"status": "SHORTLISTED"},
            format='json'
        )
        self.assertEqual(status_res.status_code, status.HTTP_200_OK)
        self.assertEqual(status_res.data['application']['status'], "SHORTLISTED")

    def test_recruiter_cannot_view_or_update_other_recruiter_applications(self):
        # Seeker applies to Recruiter 1's job
        self.client.force_authenticate(user=self.seeker1)
        apply_res = self.client.post('/api/applications/', {"job": self.active_job.id}, format='json')
        app_id = apply_res.data['application']['id']

        # Recruiter 2 tries to view Recruiter 1's job applicants
        self.client.force_authenticate(user=self.recruiter2)
        view_res = self.client.get(f'/api/applications/job/{self.active_job.id}/')
        self.assertEqual(view_res.status_code, status.HTTP_403_FORBIDDEN)

        # Recruiter 2 tries to update status
        update_res = self.client.patch(
            f'/api/applications/{app_id}/status/',
            {"status": "HIRED"},
            format='json'
        )
        self.assertEqual(update_res.status_code, status.HTTP_403_FORBIDDEN)
