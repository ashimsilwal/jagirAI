from django.db import migrations
from django.utils.text import slugify


def backfill_organizations(apps, schema_editor):
    User = apps.get_model('users', 'User')
    Organization = apps.get_model('organizations', 'Organization')
    OrganizationRole = apps.get_model('organizations', 'OrganizationRole')
    OrganizationMembership = apps.get_model('organizations', 'OrganizationMembership')
    Job = apps.get_model('jobs', 'Job')

    # Seed predefined roles
    from organizations.constants import PREDEFINED_ROLES
    for slug, data in PREDEFINED_ROLES.items():
        OrganizationRole.objects.get_or_create(
            organization__isnull=True,
            slug=slug,
            defaults={
                'name': data['name'],
                'slug': slug,
                'description': data['description'],
                'is_predefined': True,
                'permissions': data['permissions'],
            }
        )

    owner_role = OrganizationRole.objects.filter(organization__isnull=True, slug='owner').first()

    # Find all recruiters
    recruiters = User.objects.filter(role='JOB_RECRUITER')
    for recruiter in recruiters:
        # Check if already has an org
        org = Organization.objects.filter(owner=recruiter).first()
        if not org:
            # Determine company name
            company_name = f"{recruiter.username}'s Organization"
            try:
                if hasattr(recruiter, 'recruiter_profile') and recruiter.recruiter_profile.company_name:
                    company_name = recruiter.recruiter_profile.company_name
            except Exception:
                pass

            base_slug = slugify(company_name) or f"org-{recruiter.id}"
            slug = base_slug
            counter = 1
            while Organization.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1

            org = Organization.objects.create(
                name=company_name,
                slug=slug,
                owner=recruiter,
            )

        # Ensure membership
        if owner_role:
            OrganizationMembership.objects.get_or_create(
                organization=org,
                user=recruiter,
                defaults={
                    'role': owner_role,
                    'status': 'ACTIVE'
                }
            )

        # Backfill all jobs created by this recruiter
        Job.objects.filter(recruiter=recruiter, organization__isnull=True).update(organization=org)


def reverse_backfill(apps, schema_editor):
    Job = apps.get_model('jobs', 'Job')
    Job.objects.all().update(organization=None)


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0002_job_organization'),
        ('organizations', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(backfill_organizations, reverse_backfill),
    ]
