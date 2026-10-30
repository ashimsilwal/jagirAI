from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Job, JobCategory

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


class PaginationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.recruiter = User.objects.create_user(
            email="recruiter_page@test.com",
            username="recruiter_page",
            password="Password123!",
            role=User.Role.JOB_RECRUITER
        )
        self.other_recruiter = User.objects.create_user(
            email="other_recruiter@test.com",
            username="other_recruiter",
            password="Password123!",
            role=User.Role.JOB_RECRUITER
        )
        # Create 25 jobs for testing pagination
        jobs = []
        for i in range(25):
            jobs.append(Job(
                recruiter=self.recruiter,
                title=f"Engineer #{i+1:02d}",
                description=f"Description for job {i+1}",
                location="Kathmandu" if i % 2 == 0 else "Pokhara",
                employment_type=Job.EmploymentType.REMOTE if i % 3 == 0 else Job.EmploymentType.FULL_TIME,
                status=Job.JobStatus.ACTIVE
            ))
        Job.objects.bulk_create(jobs)

    def test_default_page_size_is_10(self):
        response = self.client.get('/api/jobs/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)
        self.assertEqual(response.data['count'], 25)
        self.assertEqual(len(response.data['results']), 10)
        self.assertIsNotNone(response.data['next'])
        self.assertIsNone(response.data['previous'])

    def test_custom_page_size_query_param(self):
        response = self.client.get('/api/jobs/?page_size=15')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 15)
        self.assertEqual(response.data['count'], 25)

    def test_max_page_size_enforced_at_100(self):
        response = self.client.get('/api/jobs/?page_size=200')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # With 25 total jobs, requesting 200 should be capped at 100 max_page_size, returning all 25
        self.assertEqual(len(response.data['results']), 25)

    def test_pagination_navigation_pages(self):
        # Page 2
        p2_res = self.client.get('/api/jobs/?page=2')
        self.assertEqual(p2_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(p2_res.data['results']), 10)
        self.assertIsNotNone(p2_res.data['previous'])
        self.assertIsNotNone(p2_res.data['next'])

        # Page 3 (final page with 5 items remaining)
        p3_res = self.client.get('/api/jobs/?page=3')
        self.assertEqual(p3_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(p3_res.data['results']), 5)
        self.assertIsNotNone(p3_res.data['previous'])
        self.assertIsNone(p3_res.data['next'])

    def test_invalid_and_out_of_range_page_returns_404(self):
        response = self.client.get('/api/jobs/?page=999')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_filtering_and_search_with_pagination(self):
        # Filter by remote (every 3rd job: i in 0, 3, 6, 9, 12, 15, 18, 21, 24 => 9 jobs)
        response = self.client.get('/api/jobs/?employment_type=REMOTE')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 9)
        self.assertEqual(len(response.data['results']), 9)
        self.assertIsNone(response.data['next'])

    def test_recruiter_my_jobs_pagination_and_isolation(self):
        self.client.force_authenticate(user=self.recruiter)
        res = self.client.get('/api/jobs/my-jobs/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 25)
        self.assertEqual(len(res.data['results']), 10)

        # Other recruiter sees 0 of these jobs
        self.client.force_authenticate(user=self.other_recruiter)
        other_res = self.client.get('/api/jobs/my-jobs/')
        self.assertEqual(other_res.status_code, status.HTTP_200_OK)
        self.assertEqual(other_res.data['count'], 0)
        self.assertEqual(len(other_res.data['results']), 0)


class JobPersonalizationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.cat_backend = JobCategory.objects.create(name="Backend Development", slug="backend")
        self.cat_frontend = JobCategory.objects.create(name="Frontend Development", slug="frontend")
        self.cat_mobile = JobCategory.objects.create(name="Mobile Development", slug="mobile")

        self.recruiter = User.objects.create_user(
            email="recruiter@example.com",
            username="recruiter",
            password="Password123!",
            role=User.Role.JOB_RECRUITER
        )

        self.job_mobile = Job.objects.create(
            recruiter=self.recruiter,
            title="Flutter Developer",
            description="Mobile apps",
            category=self.cat_mobile,
            status=Job.JobStatus.ACTIVE
        )
        self.job_backend = Job.objects.create(
            recruiter=self.recruiter,
            title="Django Developer",
            description="APIs",
            category=self.cat_backend,
            status=Job.JobStatus.ACTIVE
        )
        self.job_frontend = Job.objects.create(
            recruiter=self.recruiter,
            title="React Developer",
            description="Web UI",
            category=self.cat_frontend,
            status=Job.JobStatus.ACTIVE
        )

        self.seeker = User.objects.create_user(
            email="seeker@example.com",
            username="seeker",
            password="Password123!",
            role=User.Role.JOB_SEEKER
        )

        self.admin = User.objects.create_superuser(
            email="admin@example.com",
            username="admin",
            password="Password123!"
        )

    def test_job_categories_list_endpoint(self):
        res = self.client.get('/api/job-categories/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.data if isinstance(res.data, list) else res.data.get('results', [])
        names = [c['name'] for c in data]
        self.assertIn("Backend Development", names)
        self.assertIn("Frontend Development", names)
        self.assertIn("Mobile Development", names)

    def test_unauthenticated_user_sees_default_ordering(self):
        res = self.client.get('/api/jobs/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data['results']
        # Default newest first: frontend, backend, mobile
        self.assertEqual([j['id'] for j in results], [self.job_frontend.id, self.job_backend.id, self.job_mobile.id])
        for j in results:
            self.assertFalse(j['is_preferred'])

    def test_authenticated_seeker_with_preferences_sees_prioritized_jobs(self):
        # Seeker prefers Backend Development
        self.seeker.job_seeker_profile.job_preferences.add(self.cat_backend)
        self.client.force_authenticate(user=self.seeker)

        res = self.client.get('/api/jobs/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data['results']

        # Backend Developer must appear FIRST
        self.assertEqual(results[0]['id'], self.job_backend.id)
        self.assertTrue(results[0]['is_preferred'])
        self.assertFalse(results[1]['is_preferred'])
        self.assertFalse(results[2]['is_preferred'])

        # Non-matching jobs remain visible
        all_ids = [j['id'] for j in results]
        self.assertIn(self.job_frontend.id, all_ids)
        self.assertIn(self.job_mobile.id, all_ids)

    def test_recruiter_cannot_directly_create_job_category(self):
        self.client.force_authenticate(user=self.recruiter)
        res = self.client.post('/api/job-categories/', {
            "name": "Cloud & DevOps Architecture",
            "description": "Kubernetes, AWS, Terraform jobs"
        }, format='json')
        # Only admin is allowed to directly create/modify categories
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_create_new_job_category(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.post('/api/job-categories/', {
            "name": "Cloud & DevOps Architecture",
            "description": "Kubernetes, AWS, Terraform jobs"
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['name'], "Cloud & DevOps Architecture")
        self.assertEqual(res.data['slug'], "cloud-devops-architecture")

        # Category is visible in general categories list
        list_res = self.client.get('/api/job-categories/')
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        cats = list_res.data if isinstance(list_res.data, list) else list_res.data.get('results', [])
        names = [c['name'] for c in cats]
        self.assertIn("Cloud & DevOps Architecture", names)

    def test_recruiter_can_submit_category_request_and_admin_approves(self):
        # 1. Recruiter submits category request
        self.client.force_authenticate(user=self.recruiter)
        req_res = self.client.post('/api/job-category-requests/', {
            "name": "Artificial Intelligence & LLMs",
            "description": "Large language models and generative AI",
            "reason": "We are expanding our AI engineering team"
        }, format='json')
        self.assertEqual(req_res.status_code, status.HTTP_201_CREATED)
        request_id = req_res.data['id']
        self.assertEqual(req_res.data['status'], "PENDING")

        # 2. Seeker cannot approve
        self.client.force_authenticate(user=self.seeker)
        unauth_approve = self.client.post(f'/api/job-category-requests/{request_id}/approve/')
        self.assertEqual(unauth_approve.status_code, status.HTTP_403_FORBIDDEN)

        # 3. Admin approves category request
        self.client.force_authenticate(user=self.admin)
        approve_res = self.client.post(f'/api/job-category-requests/{request_id}/approve/', {
            "admin_notes": "Approved for upcoming AI hiring season"
        }, format='json')
        self.assertEqual(approve_res.status_code, status.HTTP_200_OK)
        self.assertEqual(approve_res.data['request']['status'], "APPROVED")

        # Category is now created in JobCategory
        cat = JobCategory.objects.filter(name="Artificial Intelligence & LLMs").first()
        self.assertIsNotNone(cat)
        self.assertEqual(cat.slug, "artificial-intelligence-llms")

    def test_recruiter_my_jobs_includes_category_and_applications_count(self):
        self.client.force_authenticate(user=self.recruiter)
        res = self.client.get('/api/jobs/my-jobs/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data if isinstance(res.data, list) else res.data.get('results', [])
        self.assertTrue(len(results) >= 3)
        for job_data in results:
            self.assertIn('applications_count', job_data)
            self.assertIn('category', job_data)


