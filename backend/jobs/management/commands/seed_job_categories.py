from django.core.management.base import BaseCommand
from django.utils.text import slugify
from jobs.models import JobCategory, Job


CATEGORIES = [
    {
        "name": "Backend Development",
        "slug": "backend-development",
        "description": "Server-side logic, APIs, microservices, databases, and architecture.",
        "keywords": ["backend", "django", "python", "spring boot", "java", "golang", "go", "fastapi", "laravel", ".net", "c#", "node", "ruby"]
    },
    {
        "name": "Frontend Development",
        "slug": "frontend-development",
        "description": "User interface engineering with modern frameworks like React, Vue, Next.js, and Angular.",
        "keywords": ["frontend", "react", "vue", "angular", "next.js", "nuxt", "tailwind", "web developer"]
    },
    {
        "name": "Full Stack Development",
        "slug": "full-stack-development",
        "description": "End-to-end development covering both client interfaces and backend architectures.",
        "keywords": ["full stack", "fullstack", "mern", "full-stack"]
    },
    {
        "name": "Mobile App Development",
        "slug": "mobile-app-development",
        "description": "Native and cross-platform mobile apps for iOS and Android.",
        "keywords": ["mobile", "ios", "android", "flutter", "react native", "swift", "kotlin"]
    },
    {
        "name": "UI/UX & Product Design",
        "slug": "ui-ux-design",
        "description": "Visual design, wireframing, UX research, design systems, and rapid prototyping.",
        "keywords": ["design", "ui/ux", "ux", "ui", "figma", "interaction", "product designer"]
    },
    {
        "name": "DevOps & Cloud Engineering",
        "slug": "devops-cloud",
        "description": "CI/CD pipelines, container orchestration, Kubernetes, AWS, and cloud infrastructure.",
        "keywords": ["devops", "cloud", "aws", "kubernetes", "docker", "sre", "reliability", "infrastructure", "terraform"]
    },
    {
        "name": "Cybersecurity & Infosec",
        "slug": "cybersecurity",
        "description": "Information security, ethical hacking, SOC monitoring, penetration testing, and compliance.",
        "keywords": ["security", "cyber", "penetration", "soc", "infosec", "incident", "vulnerability"]
    },
    {
        "name": "AI & Machine Learning",
        "slug": "ai-machine-learning",
        "description": "Deep learning, NLP, computer vision, large language models, and predictive AI systems.",
        "keywords": ["ai", "machine learning", "deep learning", "nlp", "llm", "pytorch", "tensorflow", "generative ai"]
    },
    {
        "name": "Data Science & Analytics",
        "slug": "data-science-analytics",
        "description": "Data pipelines, data modeling, business intelligence, analytics, and ETL workflows.",
        "keywords": ["data science", "data engineer", "data analyst", "bi", "analytics", "power bi", "tableau", "data warehouse"]
    },
    {
        "name": "Quality Assurance & Testing",
        "slug": "qa-testing",
        "description": "Automated testing, manual QA, test planning, performance, and regression testing.",
        "keywords": ["qa", "test", "quality assurance", "automation tester", "selenium", "cypress"]
    },
    {
        "name": "Product Management",
        "slug": "product-management",
        "description": "Product strategy, roadmap planning, user stories, agile leadership, and market delivery.",
        "keywords": ["product manager", "scrum", "agile", "product owner", "project manager"]
    },
    {
        "name": "Database Administration",
        "slug": "database-administration",
        "description": "Database optimization, PostgreSQL, MySQL, NoSQL scaling, and disaster recovery.",
        "keywords": ["database", "dba", "postgres", "sql server", "oracle"]
    },
    # Non-IT Fields
    {
        "name": "Accounting & Financial Services",
        "slug": "accounting-financial-services",
        "description": "Accounting, auditing, financial planning, taxation, investment, and banking operations.",
        "keywords": ["accountant", "accounting", "finance", "auditor", "audit", "tax", "banking", "bookkeeper", "cpa", "financial analyst"]
    },
    {
        "name": "Sales & Business Development",
        "slug": "sales-business-development",
        "description": "Direct sales, business development, client relations, retail, account management, and revenue growth.",
        "keywords": ["sales", "business development", "b2b", "account executive", "sales representative", "client relationship", "telesales"]
    },
    {
        "name": "Marketing, Advertising & PR",
        "slug": "marketing-advertising-pr",
        "description": "Brand management, digital marketing, PR campaigns, social media, SEO, copy, and market research.",
        "keywords": ["marketing", "digital marketing", "seo", "content writer", "social media", "public relations", "advertising", "copywriter"]
    },
    {
        "name": "Healthcare, Medical & Nursing",
        "slug": "healthcare-medical-nursing",
        "description": "Clinical healthcare, registered nursing, pharmacy, diagnostics, patient care, and hospital operations.",
        "keywords": ["nurse", "nursing", "doctor", "medical", "healthcare", "pharmacist", "clinical", "hospital", "physician", "lab technician"]
    },
    {
        "name": "Education, Academic & Teaching",
        "slug": "education-academic-teaching",
        "description": "School teaching, university lecturing, tutoring, instructional design, and academic counseling.",
        "keywords": ["teacher", "teaching", "professor", "lecturer", "tutor", "education", "curriculum", "instructor", "academic"]
    },
    {
        "name": "Human Resources & Talent Acquisition",
        "slug": "human-resources-recruitment",
        "description": "Talent sourcing, technical recruitment, employee engagement, payroll, and organizational development.",
        "keywords": ["hr", "human resources", "recruiter", "recruitment", "talent acquisition", "payroll", "people operations"]
    },
    {
        "name": "Customer Support & Client Success",
        "slug": "customer-support-success",
        "description": "Customer service, helpdesk support, client retention, call center, and customer experience operations.",
        "keywords": ["customer service", "customer support", "client success", "helpdesk", "call center", "support specialist"]
    },
    {
        "name": "Hospitality, Tourism & Culinary",
        "slug": "hospitality-tourism-culinary",
        "description": "Hotel management, front desk, travel planning, chef, food and beverage, and tourist services.",
        "keywords": ["hotel", "hospitality", "chef", "cook", "restaurant", "tourism", "travel", "front desk", "bartender", "catering"]
    },
    {
        "name": "Civil, Structural & Architectural Engineering",
        "slug": "civil-structural-engineering",
        "description": "Civil engineering, architecture, construction supervision, structural design, CAD, and surveying.",
        "keywords": ["civil engineer", "architect", "architecture", "structural", "construction", "cad", "autocad", "site engineer", "surveyor"]
    },
    {
        "name": "Supply Chain, Logistics & Procurement",
        "slug": "supply-chain-logistics",
        "description": "Warehouse management, freight forwarding, inventory control, shipping, and vendor procurement.",
        "keywords": ["logistics", "supply chain", "warehouse", "procurement", "inventory", "shipping", "freight", "fleet"]
    },
    {
        "name": "Legal, Corporate & Compliance",
        "slug": "legal-compliance",
        "description": "Corporate law, legal counsel, contract review, dispute resolution, and regulatory compliance.",
        "keywords": ["legal", "lawyer", "attorney", "counsel", "compliance", "regulatory", "contracts", "paralegal"]
    },
    {
        "name": "Administration & Office Support",
        "slug": "administration-office-support",
        "description": "Office management, executive assistance, clerical operations, data entry, and reception.",
        "keywords": ["admin", "administrator", "administrative assistant", "office manager", "receptionist", "executive assistant", "data entry"]
    },
    {
        "name": "Media, Journalism & Broadcasting",
        "slug": "media-journalism-broadcasting",
        "description": "Journalism, video production, photography, podcasting, broadcasting, and publishing.",
        "keywords": ["journalist", "reporter", "media", "editor", "video editor", "photographer", "broadcast", "videographer"]
    },
    {
        "name": "Agriculture & Agribusiness",
        "slug": "agriculture-agribusiness",
        "description": "Agronomy, farm management, agrochemical, livestock care, crop production, and agricultural commerce.",
        "keywords": ["agriculture", "agronomist", "farming", "farm", "crops", "livestock", "agribusiness", "horticulture"]
    },
    {
        "name": "Manufacturing & Industrial Production",
        "slug": "manufacturing-production",
        "description": "Factory operations, mechanical engineering, plant maintenance, assembly, and quality control.",
        "keywords": ["manufacturing", "production", "mechanical engineer", "plant manager", "factory", "assembly", "technician"]
    },
]


class Command(BaseCommand):
    help = "Seed standard job categories and backfill existing jobs"

    def handle(self, *args, **options):
        self.stdout.write("Seeding job categories...")

        created_count = 0
        cat_objs = {}
        for cat_info in CATEGORIES:
            cat, created = JobCategory.objects.get_or_create(
                slug=cat_info["slug"],
                defaults={
                    "name": cat_info["name"],
                    "description": cat_info["description"]
                }
            )
            if created:
                created_count += 1
            cat_objs[cat.slug] = (cat, cat_info["keywords"])

        self.stdout.write(self.style.SUCCESS(f"Seeded {len(cat_objs)} categories ({created_count} newly created)."))

        # Backfill existing jobs that don't have a category assigned
        unassigned_jobs = Job.objects.filter(category__isnull=True)
        total_unassigned = unassigned_jobs.count()
        self.stdout.write(f"Backfilling {total_unassigned} unassigned jobs...")

        updated_count = 0
        default_cat = cat_objs["backend-development"][0]

        for job in unassigned_jobs:
            title_lower = (job.title or "").lower()
            desc_lower = (job.description or "").lower()
            text = f"{title_lower} {desc_lower}"

            assigned = False
            for slug, (cat, keywords) in cat_objs.items():
                for kw in keywords:
                    if kw in title_lower:
                        job.category = cat
                        assigned = True
                        break
                if assigned:
                    break

            if not assigned:
                # Fallback matching on description
                for slug, (cat, keywords) in cat_objs.items():
                    for kw in keywords:
                        if kw in text:
                            job.category = cat
                            assigned = True
                            break
                    if assigned:
                        break

            if not assigned:
                job.category = default_cat

            job.save(update_fields=['category'])
            updated_count += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully categorized {updated_count} jobs!"))

