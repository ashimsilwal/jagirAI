from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from .models import JobSeekerProfile, RecruiterProfile
from jobs.models import JobCategory

User = get_user_model()


class AuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/auth/register/'
        self.login_url = '/api/auth/login/'
        self.refresh_url = '/api/auth/refresh/'
        self.logout_url = '/api/auth/logout/'
        self.me_url = '/api/auth/me/'

        self.user_data = {
            "username": "alex_recruiter",
            "email": "alex@company.com",
            "password": "SecurePassword123!",
            "confirm_password": "SecurePassword123!",
            "role": "JOB_RECRUITER"
        }

    def test_user_registration_success(self):
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user']['email'], "alex@company.com")
        self.assertEqual(response.data['user']['role'], "JOB_RECRUITER")
        self.assertNotIn('password', response.data['user'])

    def test_user_registration_password_mismatch(self):
        invalid_data = self.user_data.copy()
        invalid_data['confirm_password'] = "DifferentPass123!"
        response = self.client.post(self.register_url, invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('confirm_password', response.data)

    def test_user_login_success(self):
        self.client.post(self.register_url, self.user_data, format='json')
        login_payload = {
            "email": "alex@company.com",
            "password": "SecurePassword123!"
        }
        response = self.client.post(self.login_url, login_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['email'], "alex@company.com")

    def test_authenticated_me_endpoint(self):
        self.client.post(self.register_url, self.user_data, format='json')
        login_res = self.client.post(
            self.login_url,
            {"email": "alex@company.com", "password": "SecurePassword123!"},
            format='json'
        )
        access_token = login_res.data['access']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], "alex@company.com")

    def test_logout_and_token_blacklist(self):
        self.client.post(self.register_url, self.user_data, format='json')
        login_res = self.client.post(
            self.login_url,
            {"email": "alex@company.com", "password": "SecurePassword123!"},
            format='json'
        )
        access_token = login_res.data['access']
        refresh_token = login_res.data['refresh']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        logout_res = self.client.post(
            self.logout_url,
            {"refresh": refresh_token},
            format='json'
        )
        self.assertEqual(logout_res.status_code, status.HTTP_200_OK)

        refresh_attempt = self.client.post(
            self.refresh_url,
            {"refresh": refresh_token},
            format='json'
        )
        self.assertEqual(refresh_attempt.status_code, status.HTTP_401_UNAUTHORIZED)


class ProfileTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create Job Seeker
        self.seeker = User.objects.create_user(
            email="seeker@example.com",
            username="seeker1",
            password="Password123!",
            role=User.Role.JOB_SEEKER
        )

        # Create Recruiter
        self.recruiter = User.objects.create_user(
            email="recruiter@example.com",
            username="recruiter1",
            password="Password123!",
            role=User.Role.JOB_RECRUITER
        )

    def test_signals_created_profiles(self):
        self.assertTrue(JobSeekerProfile.objects.filter(user=self.seeker).exists())
        self.assertTrue(RecruiterProfile.objects.filter(user=self.recruiter).exists())

    def test_job_seeker_profile_get_and_patch(self):
        self.client.force_authenticate(user=self.seeker)
        response = self.client.get('/api/profile/job-seeker/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['email'], "seeker@example.com")

        # Update profile
        patch_res = self.client.patch(
            '/api/profile/job-seeker/',
            {
                "bio": "Experienced Python & React Developer",
                "skills": "Python, Django, React, TypeScript",
                "location": "San Francisco, CA"
            },
            format='json'
        )
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data['bio'], "Experienced Python & React Developer")
        self.assertEqual(patch_res.data['location'], "San Francisco, CA")

    def test_recruiter_forbidden_from_job_seeker_profile(self):
        self.client.force_authenticate(user=self.recruiter)
        response = self.client.get('/api/profile/job-seeker/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_recruiter_profile_get_and_patch(self):
        self.client.force_authenticate(user=self.recruiter)
        response = self.client.get('/api/profile/recruiter/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['email'], "recruiter@example.com")

        # Update recruiter profile
        patch_res = self.client.patch(
            '/api/profile/recruiter/',
            {
                "company_name": "Tech Innovators Inc.",
                "company_website": "https://techinnovators.com",
                "location": "New York, NY"
            },
            format='json'
        )
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data['company_name'], "Tech Innovators Inc.")

    def test_job_seeker_forbidden_from_recruiter_profile(self):
        self.client.force_authenticate(user=self.seeker)
        response = self.client.get('/api/profile/recruiter/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_invalid_resume_file_extension(self):
        self.client.force_authenticate(user=self.seeker)
        fake_file = SimpleUploadedFile("resume.exe", b"malicious content", content_type="application/octet-stream")
        response = self.client.patch(
            '/api/profile/job-seeker/',
            {"resume": fake_file},
            format='multipart'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("resume", response.data)


class AdminManagementTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            email="admin@example.com",
            username="superadmin",
            password="AdminPassword123!"
        )
        self.regular_user = User.objects.create_user(
            email="regular@example.com",
            username="regular_seeker",
            password="RegularPassword123!",
            role=User.Role.JOB_SEEKER
        )

    def test_non_admin_forbidden_from_admin_endpoints(self):
        self.client.force_authenticate(user=self.regular_user)
        stats_res = self.client.get('/api/admin/stats/')
        self.assertEqual(stats_res.status_code, status.HTTP_403_FORBIDDEN)

        users_res = self.client.get('/api/admin/users/')
        self.assertEqual(users_res.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_view_stats_and_list_users(self):
        self.client.force_authenticate(user=self.admin)
        stats_res = self.client.get('/api/admin/stats/')
        self.assertEqual(stats_res.status_code, status.HTTP_200_OK)
        self.assertIn('total_users', stats_res.data)
        self.assertEqual(stats_res.data['total_users'], 2)

        users_res = self.client.get('/api/admin/users/?search=regular')
        self.assertEqual(users_res.status_code, status.HTTP_200_OK)
        results = users_res.data['results'] if 'results' in users_res.data else users_res.data
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['email'], "regular@example.com")

    def test_admin_can_update_user_status(self):
        self.client.force_authenticate(user=self.admin)
        patch_res = self.client.patch(
            f'/api/admin/users/{self.regular_user.id}/',
            {"is_active": False},
            format='json'
        )
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.regular_user.refresh_from_db()
        self.assertFalse(self.regular_user.is_active)

    def test_admin_cannot_delete_self(self):
        self.client.force_authenticate(user=self.admin)
        del_self = self.client.delete(f'/api/admin/users/{self.admin.id}/')
        self.assertEqual(del_self.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_can_delete_other_user(self):
        self.client.force_authenticate(user=self.admin)
        del_res = self.client.delete(f'/api/admin/users/{self.regular_user.id}/')
        self.assertEqual(del_res.status_code, status.HTTP_200_OK)
        self.assertFalse(User.objects.filter(id=self.regular_user.id).exists())


class JobSeekerPreferencesTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.cat1 = JobCategory.objects.create(name="Backend Development", slug="backend-dev")
        self.cat2 = JobCategory.objects.create(name="Frontend Development", slug="frontend-dev")
        self.cat3 = JobCategory.objects.create(name="Data Science", slug="data-science")

        self.seeker = User.objects.create_user(
            email="seeker@example.com",
            username="seeker_user",
            password="Password123!",
            role=User.Role.JOB_SEEKER
        )
        self.recruiter = User.objects.create_user(
            email="recruiter@example.com",
            username="recruiter_user",
            password="Password123!",
            role=User.Role.JOB_RECRUITER
        )
        self.preferences_url = '/api/job-seeker/preferences/'
        self.setup_url = '/api/profile/setup/'

    def test_unauthenticated_cannot_access_preferences(self):
        res = self.client.get(self.preferences_url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_recruiter_forbidden_from_seeker_preferences(self):
        self.client.force_authenticate(user=self.recruiter)
        res = self.client.get(self.preferences_url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_seeker_get_empty_preferences(self):
        self.client.force_authenticate(user=self.seeker)
        res = self.client.get(self.preferences_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['category_ids'], [])

    def test_seeker_update_and_retrieve_preferences(self):
        self.client.force_authenticate(user=self.seeker)
        payload = {"category_ids": [self.cat1.id, self.cat3.id]}
        res = self.client.put(self.preferences_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertCountEqual(res.data['category_ids'], [self.cat1.id, self.cat3.id])

        # Verify get
        get_res = self.client.get(self.preferences_url)
        self.assertCountEqual(get_res.data['category_ids'], [self.cat1.id, self.cat3.id])
        category_names = [c['name'] for c in get_res.data['categories']]
        self.assertIn("Backend Development", category_names)
        self.assertIn("Data Science", category_names)

    def test_seeker_clear_preferences(self):
        self.client.force_authenticate(user=self.seeker)
        self.seeker.job_seeker_profile.job_preferences.add(self.cat1)

        res = self.client.put(self.preferences_url, {"category_ids": []}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['category_ids'], [])
        self.assertEqual(self.seeker.job_seeker_profile.job_preferences.count(), 0)

    def test_seeker_invalid_category_id_rejected(self):
        self.client.force_authenticate(user=self.seeker)
        res = self.client.put(self.preferences_url, {"category_ids": [99999]}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_onboarding_with_preferences(self):
        new_seeker = User.objects.create_user(
            email="newseeker@example.com",
            username="newseeker",
            password="Password123!",
            role=User.Role.JOB_SEEKER
        )
        self.client.force_authenticate(user=new_seeker)
        payload = {
            "username": "New Seeker Name",
            "skills": "Python, React",
            "category_ids": [self.cat1.id, self.cat2.id]
        }
        res = self.client.post(self.setup_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        new_seeker.refresh_from_db()
        self.assertTrue(new_seeker.is_profile_setup)
        self.assertCountEqual(
            list(new_seeker.job_seeker_profile.job_preferences.values_list('id', flat=True)),
            [self.cat1.id, self.cat2.id]
        )


