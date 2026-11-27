"""
Constants and definitions for Organization Team Management, Roles & Granular Permissions.
"""

# All granular permissions supported in Jagir AI
ALL_PERMISSIONS = {
    # Organization
    "organization.view": "View organization details and profile",
    "organization.update": "Update organization profile, branding, and details",
    "organization.manage_settings": "Manage organization recruitment settings and preferences",

    # Team & Staff
    "team.view": "View team members and staff roster",
    "team.create_member": "Create new organization team members directly",
    "team.invite": "Invite new team members",
    "team.manage_members": "Update member roles, statuses, and permissions",
    "team.assign_roles": "Assign roles to team members",
    "team.remove_members": "Remove or suspend team members",

    # Vacancies
    "vacancy.view": "View organization job vacancies",
    "vacancy.create": "Create new job vacancies",
    "vacancy.edit": "Edit existing job vacancies",
    "vacancy.publish": "Publish or change job vacancy status",
    "vacancy.archive": "Archive job vacancies",
    "vacancy.delete": "Delete job vacancies",

    # Applications
    "application.view": "View submitted applications for organization jobs",
    "application.review": "Review candidate applications and resumes",
    "application.update_status": "Update candidate application status (Shortlist, Reject, etc.)",
    "application.manage": "Full management of applications and recruitment stages",

    # Candidates
    "candidate.view": "View candidate profile information",
    "candidate.view_sensitive_information": "View sensitive candidate details, contacts, and notes",

    # Reports & Analytics
    "reports.view": "Access organization recruitment analytics and reports",

    # Activity Log
    "activity.view": "View organization audit trail and activity log",
}

# Predefined System Roles and their assigned default permissions
PREDEFINED_ROLES = {
    "owner": {
        "name": "Organization Owner",
        "slug": "owner",
        "description": "Full administrative control over the organization, team, vacancies, and recruitment operations.",
        "permissions": list(ALL_PERMISSIONS.keys()),
    },
    "admin": {
        "name": "Organization Administrator",
        "slug": "admin",
        "description": "Manage team members, invitations, vacancies, and application workflows without ownership rights.",
        "permissions": [
            "organization.view",
            "organization.update",
            "team.view",
            "team.create_member",
            "team.invite",
            "team.manage_members",
            "team.assign_roles",
            "vacancy.view",
            "vacancy.create",
            "vacancy.edit",
            "vacancy.publish",
            "vacancy.archive",
            "application.view",
            "application.review",
            "application.update_status",
            "application.manage",
            "candidate.view",
            "reports.view",
            "activity.view",
        ],
    },
    "hr_manager": {
        "name": "HR Manager",
        "slug": "hr_manager",
        "description": "Create and manage vacancies, review candidates, update statuses, and access recruitment reports.",
        "permissions": [
            "organization.view",
            "team.view",
            "vacancy.view",
            "vacancy.create",
            "vacancy.edit",
            "vacancy.publish",
            "application.view",
            "application.review",
            "application.update_status",
            "candidate.view",
            "candidate.view_sensitive_information",
            "reports.view",
            "activity.view",
        ],
    },
    "recruiter": {
        "name": "Recruiter",
        "slug": "recruiter",
        "description": "Create and manage vacancies, review candidates, and update application statuses.",
        "permissions": [
            "organization.view",
            "vacancy.view",
            "vacancy.create",
            "vacancy.edit",
            "application.view",
            "application.review",
            "application.update_status",
            "candidate.view",
        ],
    },
    "reviewer": {
        "name": "Application Reviewer",
        "slug": "reviewer",
        "description": "Review candidate profiles and submitted application materials without editing permissions.",
        "permissions": [
            "organization.view",
            "vacancy.view",
            "application.view",
            "application.review",
            "candidate.view",
        ],
    },
    "read_only": {
        "name": "Read-Only Member",
        "slug": "read_only",
        "description": "Read-only access to organization vacancies and candidate submissions.",
        "permissions": [
            "organization.view",
            "vacancy.view",
            "application.view",
        ],
    },
}
