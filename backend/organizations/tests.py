from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from .models import (
    Organization,
    OrganizationRole,
    OrganizationMembership,
    OrganizationInvitation,
    OrganizationActivityLog,
)
from .services import (
    ensure_predefined_roles,
    get_or_create_user_organization,
    create_invitation,
    validate_invitation,
    accept_invitation,
)
from .constants import PREDEFINED_ROLES, ALL_PERMISSIONS
from jobs.models import Job
from applications.models import Application

User = get_user_model()


class OrganizationTeamManagementTests(APITestCase):
    def setUp(self):
        ensure_predefined_roles()

        # Recruiter / Org Owner 1
        self.owner = User.objects.create_user(
            username='owner_alpha',
            email='owner@alpha.com',
            password='Password123!',
            role=User.Role.JOB_RECRUITER
        )
        self.org = get_or_create_user_organization(self.owner)

        # Recruiter / Org Owner 2 (Different Organization)
        self.other_owner = User.objects.create_user(
            username='owner_beta',
            email='owner@beta.com',
            password='Password123!',
            role=User.Role.JOB_RECRUITER
        )
        self.other_org = get_or_create_user_organization(self.other_owner)

        # Team member invitee
        self.invitee_user = User.objects.create_user(
            username='sarah_recruiter',
            email='sarah@alpha.com',
            password='Password123!',
            role=User.Role.JOB_SEEKER
        )

        self.recruiter_role = OrganizationRole.objects.get(slug='recruiter', organization__isnull=True)
        self.admin_role = OrganizationRole.objects.get(slug='admin', organization__isnull=True)
        self.read_only_role = OrganizationRole.objects.get(slug='read_only', organization__isnull=True)

    def test_predefined_roles_seeded(self):
        """Test that all 6 predefined system roles are populated with designated permissions."""
        self.assertEqual(OrganizationRole.objects.filter(organization__isnull=True).count(), 6)
        owner_role = OrganizationRole.objects.get(slug='owner', organization__isnull=True)
        self.assertEqual(len(owner_role.permissions), len(ALL_PERMISSIONS))

    def test_organization_auto_provisioned_and_owner_membership_created(self):
        """Test that recruiters get an organization and active owner membership."""
        membership = OrganizationMembership.objects.filter(
            organization=self.org,
            user=self.owner,
            status=OrganizationMembership.Status.ACTIVE
        ).first()
        self.assertIsNotNone(membership)
        self.assertEqual(membership.role.slug, 'owner')
        self.assertTrue(membership.has_permission('organization.manage_settings'))
        self.assertTrue(membership.has_permission('vacancy.create'))

    def test_send_invitation_creates_secure_hash(self):
        """Test that sending an invitation stores SHA-256 hash, not raw bearer token."""
        self.client.force_authenticate(user=self.owner)
        response = self.client.post('/api/organizations/invitations/', {
            'email': 'new_member@alpha.com',
            'role_id': self.recruiter_role.id,
            'expiry_days': 7
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('invitation_link', response.data)
        raw_token = response.data['invitation_link'].split('token=')[1]

        # In DB, only hash is stored
        invitation = OrganizationInvitation.objects.get(email='new_member@alpha.com')
        self.assertNotEqual(invitation.token_hash, raw_token)
        self.assertEqual(len(invitation.token_hash), 64)  # SHA-256 length

        # Verify activity log
        log_entry = OrganizationActivityLog.objects.filter(
            organization=self.org,
            action=OrganizationActivityLog.Action.MEMBER_INVITED
        ).first()
        self.assertIsNotNone(log_entry)

    def test_cannot_send_duplicate_pending_invitation(self):
        """Test that duplicate active invitations to the same email are blocked."""
        self.client.force_authenticate(user=self.owner)
        payload = {
            'email': 'duplicate@alpha.com',
            'role_id': self.recruiter_role.id,
        }
        res1 = self.client.post('/api/organizations/invitations/', payload, format='json')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        res2 = self.client.post('/api/organizations/invitations/', payload, format='json')
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', res2.data)

    def test_invitation_acceptance_lifecycle(self):
        """Test complete validate -> accept invitation workflow."""
        invitation, raw_token = create_invitation(
            organization=self.org,
            email=self.invitee_user.email,
            role=self.recruiter_role,
            invited_by=self.owner
        )

        # 1. Public validate endpoint
        val_res = self.client.get(f'/api/organizations/public-invite/validate/?token={raw_token}')
        self.assertEqual(val_res.status_code, status.HTTP_200_OK)
        self.assertTrue(val_res.data['valid'])
        self.assertEqual(val_res.data['organization_name'], self.org.name)
        self.assertEqual(val_res.data['email'], self.invitee_user.email)

        # 2. Accept while authenticated as invitee
        self.client.force_authenticate(user=self.invitee_user)
        accept_res = self.client.post('/api/organizations/public-invite/accept/', {
            'token': raw_token
        }, format='json')
        self.assertEqual(accept_res.status_code, status.HTTP_200_OK)

        # Member is now ACTIVE in organization
        membership = OrganizationMembership.objects.get(
            organization=self.org,
            user=self.invitee_user
        )
        self.assertEqual(membership.status, OrganizationMembership.Status.ACTIVE)
        self.assertEqual(membership.role.slug, 'recruiter')
        self.invitee_user.refresh_from_db()
        self.assertEqual(self.invitee_user.role, User.Role.JOB_RECRUITER)

        # Token cannot be reused
        reused_res = self.client.post('/api/organizations/public-invite/accept/', {
            'token': raw_token
        }, format='json')
        self.assertEqual(reused_res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_expired_or_revoked_invitation_rejected(self):
        """Test that expired or revoked invitations cannot be accepted."""
        invitation, raw_token = create_invitation(
            organization=self.org,
            email='expired@alpha.com',
            role=self.recruiter_role,
            invited_by=self.owner
        )
        # Fast-forward expiry
        invitation.expires_at = timezone.now() - timedelta(hours=1)
        invitation.save()

        user = User.objects.create_user(
            username='expired_user',
            email='expired@alpha.com',
            password='Password123!'
        )
        self.client.force_authenticate(user=user)
        res = self.client.post('/api/organizations/public-invite/accept/', {
            'token': raw_token
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_privilege_escalation_prevented(self):
        """Test that non-owner members cannot assign permissions exceeding their own authority."""
        # Create a member with HR Manager role
        hr_user = User.objects.create_user(
            username='hr_user',
            email='hr@alpha.com',
            password='Password123!',
            role=User.Role.JOB_RECRUITER
        )
        hr_role = OrganizationRole.objects.get(slug='hr_manager', organization__isnull=True)
        OrganizationMembership.objects.create(
            organization=self.org,
            user=hr_user,
            role=hr_role,
            status=OrganizationMembership.Status.ACTIVE
        )

        self.client.force_authenticate(user=hr_user)
        # HR user cannot create a role with 'organization.manage_settings' (which they lack)
        res = self.client.post('/api/organizations/roles/', {
            'name': 'Super Power Custom Role',
            'permissions': ['organization.manage_settings', 'vacancy.create']
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_cross_organization_data_isolation(self):
        """Test that members of Org Alpha cannot access or edit Org Beta jobs."""
        # Create job in Org Beta
        job_beta = Job.objects.create(
            recruiter=self.other_owner,
            organization=self.other_org,
            title='Confidential Beta Role',
            description='Secret',
            location='Kathmandu'
        )

        # Authenticate as Org Alpha owner
        self.client.force_authenticate(user=self.owner)

        # Cannot edit Beta job
        res_edit = self.client.patch(f'/api/jobs/{job_beta.id}/', {
            'title': 'Hacked Title'
        }, format='json')
        self.assertEqual(res_edit.status_code, status.HTTP_403_FORBIDDEN)

        # Cannot delete Beta job
        res_del = self.client.delete(f'/api/jobs/{job_beta.id}/')
        self.assertEqual(res_del.status_code, status.HTTP_403_FORBIDDEN)

    def test_suspended_member_loses_access(self):
        """Test that suspended members immediately lose permission to perform actions."""
        member_user = User.objects.create_user(
            username='suspended_user',
            email='suspended@alpha.com',
            password='Password123!',
            role=User.Role.JOB_RECRUITER
        )
        membership = OrganizationMembership.objects.create(
            organization=self.org,
            user=member_user,
            role=self.recruiter_role,
            status=OrganizationMembership.Status.ACTIVE
        )

        # Suspend member
        self.client.force_authenticate(user=self.owner)
        res_suspend = self.client.patch(f'/api/organizations/members/{membership.id}/', {
            'status': 'SUSPENDED'
        }, format='json')
        self.assertEqual(res_suspend.status_code, status.HTTP_200_OK)

        # Member tries to access my-jobs
        self.client.force_authenticate(user=member_user)
        res_access = self.client.get('/api/jobs/my-jobs/')
        self.assertEqual(res_access.status_code, status.HTTP_403_FORBIDDEN)

    def test_read_only_member_cannot_modify_applications(self):
        """Test that Read-Only members cannot update candidate application statuses."""
        ro_user = User.objects.create_user(
            username='ro_user',
            email='ro@alpha.com',
            password='Password123!',
            role=User.Role.JOB_RECRUITER
        )
        OrganizationMembership.objects.create(
            organization=self.org,
            user=ro_user,
            role=self.read_only_role,
            status=OrganizationMembership.Status.ACTIVE
        )

        job = Job.objects.create(
            recruiter=self.owner,
            organization=self.org,
            title='Staff Software Engineer',
            description='Tech position',
            location='Kathmandu'
        )
        applicant = User.objects.create_user(
            username='cand_1',
            email='cand1@example.com',
            password='Password123!',
            role=User.Role.JOB_SEEKER
        )
        app = Application.objects.create(job=job, applicant=applicant, status=Application.ApplicationStatus.APPLIED)

        self.client.force_authenticate(user=ro_user)
        patch_res = self.client.patch(f'/api/applications/{app.id}/status/', {
            'status': Application.ApplicationStatus.SHORTLISTED
        }, format='json')
        self.assertEqual(patch_res.status_code, status.HTTP_403_FORBIDDEN)

    def test_direct_member_creation_success(self):
        """Test that an authorized organization owner can directly create a team member with an OTP."""
        self.client.force_authenticate(user=self.owner)
        payload = {
            "full_name": "Devin Analyst",
            "email": "devin.analyst@alpha.com",
            "role_id": self.recruiter_role.id,
            "custom_permissions": ["vacancy.create"]
        }
        res = self.client.post('/api/organizations/members/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn("one_time_password", res.data)
        otp = res.data["one_time_password"]
        self.assertTrue(len(otp) >= 8)

        # Verify user exists in database, password matches OTP, and must_change_password is True
        created_user = User.objects.get(email="devin.analyst@alpha.com")
        self.assertTrue(created_user.check_password(otp))
        self.assertTrue(created_user.must_change_password)
        self.assertTrue(created_user.is_active)

        # Verify membership
        membership = OrganizationMembership.objects.get(user=created_user, organization=self.org)
        self.assertEqual(membership.status, OrganizationMembership.Status.ACTIVE)
        self.assertIn("vacancy.create", membership.custom_permissions)

        # Verify member with must_change_password cannot create vacancies
        self.client.force_authenticate(user=created_user)
        job_res = self.client.post('/api/jobs/', {
            'title': 'Test Job',
            'description': 'Test Description',
            'location': 'Kathmandu'
        }, format='json')
        self.assertEqual(job_res.status_code, status.HTTP_403_FORBIDDEN)

        # Member changes initial password
        change_res = self.client.post('/api/auth/change-initial-password/', {
            'password': 'PermanentSecurePassword123!',
            'confirm_password': 'PermanentSecurePassword123!'
        }, format='json')
        self.assertEqual(change_res.status_code, status.HTTP_200_OK)

        created_user.refresh_from_db()
        self.assertFalse(created_user.must_change_password)
        self.assertTrue(created_user.check_password('PermanentSecurePassword123!'))

    def test_direct_member_creation_duplicate_email_rejected(self):
        """Test that attempting to create a member with an existing email returns 400."""
        self.client.force_authenticate(user=self.owner)
        payload = {
            "full_name": "Sarah Recruiter",
            "email": self.invitee_user.email,  # Already exists!
            "role_id": self.recruiter_role.id,
        }
        res = self.client.post('/api/organizations/members/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", res.data)
        self.assertIn("already exists", str(res.data['email']))

    def test_direct_member_creation_email_format_validation(self):
        """Test that invalid email formats fail validation."""
        self.client.force_authenticate(user=self.owner)
        payload = {
            "full_name": "New Person",
            "email": "invalid-email-format",
            "role_id": self.recruiter_role.id,
        }
        res = self.client.post('/api/organizations/members/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", res.data)

    def test_member_password_reset(self):
        """Test that an authorized admin can reset a member's password."""
        # Create a member first
        member_user = User.objects.create_user(
            username='temp_member',
            email='temp@alpha.com',
            password='OldPassword123!',
            role=User.Role.JOB_RECRUITER
        )
        membership = OrganizationMembership.objects.create(
            organization=self.org,
            user=member_user,
            role=self.recruiter_role,
            status=OrganizationMembership.Status.ACTIVE
        )

        self.client.force_authenticate(user=self.owner)
        reset_payload = {
            "password": "NewBrandSecurePassword123!",
            "confirm_password": "NewBrandSecurePassword123!"
        }
        res = self.client.post(f'/api/organizations/members/{membership.id}/reset_password/', reset_payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        member_user.refresh_from_db()
        self.assertTrue(member_user.check_password("NewBrandSecurePassword123!"))
        self.assertFalse(member_user.check_password("OldPassword123!"))
