from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Job

User = get_user_model()


class JobTests(TestCase):
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

        # Job Seeker
        self.seeker = User.objects.create_user(
            email="seeker@example.com",
            username="seeker1",
            password="Password123!",
            role=User.Role.JOB_SEEKER
        )

        # Pre-create a job for Recruiter 1
        self.job1 = Job.objects.create(
            recruiter=self.recruiter1,
            title="Senior Backend Engineer",
            description="Build scalable Django APIs",
            requirements="Python, Django, PostgreSQL",
            responsibilities="Design database schemas, implement REST APIs",
            location="Remote",
            salary="Rs. 120,000 - Rs. 150,000",
            employment_type=Job.EmploymentType.FULL_TIME,
            status=Job.JobStatus.ACTIVE
        )

    def test_recruiter_can_create_job(self):
        self.client.force_authenticate(user=self.recruiter1)
        payload = {
            "title": "Frontend React Developer",
            "description": "Build Next.js web application",
            "requirements": "React, TypeScript, CSS",
            "responsibilities": "Develop responsive components",
            "location": "New York, NY",
            "salary": "Rs. 100,000 - Rs. 130,000",
            "employment_type": "FULL_TIME",
            "status": "ACTIVE"
        }
        response = self.client.post('/api/jobs/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], "Frontend React Developer")
        self.assertEqual(response.data['recruiter']['email'], self.recruiter1.email)

    def test_job_seeker_cannot_create_job(self):
        self.client.force_authenticate(user=self.seeker)
        payload = {
            "title": "DevOps Engineer",
            "description": "Manage cloud infrastructure",
            "location": "Remote"
        }
        response = self.client.post('/api/jobs/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_public_and_seeker_can_list_and_search_jobs(self):
        # Public search
        response = self.client.get('/api/jobs/?search=Senior')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results'] if 'results' in response.data else response.data), 1)

        # Filter by employment_type
        filter_res = self.client.get('/api/jobs/?employment_type=FULL_TIME')
        self.assertEqual(filter_res.status_code, status.HTTP_200_OK)

    def test_recruiter_can_update_own_job(self):
        self.client.force_authenticate(user=self.recruiter1)
        response = self.client.patch(
            f'/api/jobs/{self.job1.id}/',
            {"salary": "Rs. 130,000 - Rs. 160,000"},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.job1.refresh_from_db()
        self.assertEqual(self.job1.salary, "Rs. 130,000 - Rs. 160,000")

    def test_recruiter_cannot_modify_other_recruiter_job(self):
        # Recruiter 2 attempts to modify Recruiter 1's job
        self.client.force_authenticate(user=self.recruiter2)
        response = self.client.patch(
            f'/api/jobs/{self.job1.id}/',
            {"title": "Hacked Title"},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_recruiter_my_jobs_endpoint(self):
        # Create a draft job for Recruiter 1
        Job.objects.create(
            recruiter=self.recruiter1,
            title="Draft Internal Role",
            description="Internal planning",
            location="Headquarters",
            status=Job.JobStatus.DRAFT
        )

        self.client.force_authenticate(user=self.recruiter1)
        response = self.client.get('/api/jobs/my-jobs/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data['results'] if 'results' in response.data else response.data
        self.assertEqual(len(data), 2)
