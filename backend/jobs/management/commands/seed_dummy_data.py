import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from users.models import User, RecruiterProfile, JobSeekerProfile
from jobs.models import Job
from applications.models import Application


COMPANIES = [
    ("Leapfrog Technology", "Leading software development and health-tech innovations.", "Kathmandu, Nepal", "https://lftechnology.com"),
    ("CloudFactory", "Scalable cloud and AI-driven human-in-the-loop work solutions.", "Lalitpur, Nepal", "https://cloudfactory.com"),
    ("Cotiviti Nepal", "Healthcare data analytics and payment integrity platform engineering.", "Kathmandu, Nepal", "https://cotiviti.com.np"),
    ("Fusemachines", "Enterprise AI systems, predictive analytics, and natural language platforms.", "Kathmandu, Nepal", "https://fusemachines.com"),
    ("Deerhold Nepal", "High-performance software and cloud engineering solutions.", "Kathmandu, Nepal", "https://deerhold.com"),
    ("Cedar Gate Technologies", "Advanced healthcare performance analytics and SaaS tools.", "Lalitpur, Nepal", "https://cedargate.com"),
    ("ebPearls", "Award-winning full-stack web, mobile, and digital product agency.", "Lalitpur, Nepal", "https://ebpearls.com.au"),
    ("Logpoint Nepal", "Next-generation SIEM, cybersecurity, and log management systems.", "Kathmandu, Nepal", "https://logpoint.com"),
    ("Innovate Tech", "Enterprise cloud migrations, fintech integrations, and automated pipelines.", "Kathmandu, Nepal", "https://innovatetech.com.np"),
    ("YoungInnovations", "Creating open technologies and civic-tech platforms for real-world impact.", "Lalitpur, Nepal", "https://younginnovations.com.np"),
    ("Genese Solution", "AWS Advanced Consulting Partner and cloud transformation advisory.", "Kathmandu, Nepal", "https://genesesolution.com"),
    ("Fivizo Tech and Marketing", "Full-scale modern digital transformation, recruitment and SaaS consultancy.", "Kathmandu, Nepal", "https://fivizo.com"),
    ("TechCorp International", "Global scalable enterprise recruitment and tech outsourcing.", "Remote", "https://techcorp.example.com"),
    ("Khalti Digital Wallet", "Fast-growing digital payment ecosystem and fintech API infrastructure.", "Lalitpur, Nepal", "https://khalti.com"),
    ("eSewa Payments", "Pioneering online payment gateway and bill payments in Nepal.", "Kathmandu, Nepal", "https://esewa.com.np"),
    ("Daraz Nepal", "The leading e-commerce marketplace and logistics management network.", "Kathmandu, Nepal", "https://daraz.com.np"),
    ("LIS Nepal", "Business intelligence, Oracle retail implementations, and data engineering.", "Lalitpur, Nepal", "https://lisnepal.com.np"),
    ("BrainDigit Solutions", "Enterprise CMS, e-learning platforms, and digital products.", "Kathmandu, Nepal", "https://braindigit.com"),
    ("Vianet Communications", "High-speed optical fiber network, FTTH, and ISP infrastructure.", "Lalitpur, Nepal", "https://vianet.com.np"),
    ("WorldLink Tech", "Nationwide internet connectivity, network security, and data centers.", "Kathmandu, Nepal", "https://worldlink.com.np"),
]

TITLES_BY_DOMAIN = [
    # Full Stack & Backend
    ("Senior Python / Django Architect", "Python, Django, PostgreSQL, Celery, Redis, Docker, REST API", "BACKEND"),
    ("Full Stack Next.js & Node Developer", "Next.js, TypeScript, React 19, Node.js, Express, Tailwind CSS, PostgreSQL", "FULLSTACK"),
    ("Backend Engineer (Go & Microservices)", "Go (Golang), gRPC, Docker, Kubernetes, Kafka, PostgreSQL", "BACKEND"),
    ("Senior Java Spring Boot Engineer", "Java 17, Spring Boot, Hibernate, Microservices, AWS, MySQL", "BACKEND"),
    ("FastAPI & Cloud Services Developer", "Python, FastAPI, SQLAlchemy, AWS Lambda, DynamoDB, Docker", "BACKEND"),
    ("Full Stack Ruby on Rails Engineer", "Ruby, Rails 7, Hotwire, Stimulus, PostgreSQL, Redis", "FULLSTACK"),
    (".NET Core Enterprise Developer", "C#, .NET 8, ASP.NET Core, SQL Server, Azure DevOps, EF Core", "BACKEND"),
    ("PHP / Laravel Web Developer", "PHP 8.2, Laravel, MySQL, Redis, REST APIs, Vue.js", "BACKEND"),
    
    # Frontend & UI/UX
    ("Lead React / Next.js Frontend Developer", "React, Next.js App Router, TypeScript, Tailwind CSS, GraphQL", "FRONTEND"),
    ("Frontend Vue.js / Nuxt Specialist", "Vue 3, Nuxt 3, TypeScript, Pinia, Tailwind CSS, Vite", "FRONTEND"),
    ("Senior UI/UX Product Designer", "Figma, Design Systems, User Research, Wireframing, Prototyping, Usability Testing", "DESIGN"),
    ("Creative Interaction & Motion Designer", "Figma, Framer, CSS Animations, Webflow, Design Systems", "DESIGN"),
    ("Angular Enterprise Application Developer", "Angular 18, RxJS, NgRx, TypeScript, SCSS, Jasmine/Karma", "FRONTEND"),
    
    # Mobile
    ("Senior React Native Mobile Engineer", "React Native, TypeScript, Redux Toolkit, iOS, Android, Native Modules", "MOBILE"),
    ("Flutter Mobile App Specialist", "Flutter, Dart, Bloc/Riverpod, Clean Architecture, Firebase, REST APIs", "MOBILE"),
    ("iOS Native Swift Developer", "Swift, SwiftUI, Combine, CoreData, Xcode, TestFlight", "MOBILE"),
    ("Android Native Kotlin Engineer", "Kotlin, Jetpack Compose, Coroutines, Flow, Room, Dagger Hilt", "MOBILE"),
    
    # DevOps, Cloud & Security
    ("Senior DevOps & Kubernetes Engineer", "Kubernetes, Docker, Terraform, CI/CD (GitHub Actions), AWS, Helm, Prometheus", "DEVOPS"),
    ("Cloud Infrastructure Architect (AWS)", "AWS (ECS, EKS, RDS, CloudFront), Terraform, Linux, Bash, Site Reliability", "DEVOPS"),
    ("Site Reliability Engineer (SRE)", "Linux, Python/Go, Datadog, Grafana, Incident Management, Distributed Systems", "DEVOPS"),
    ("Cybersecurity & SOC Analyst", "SIEM, Vulnerability Assessment, Penetration Testing, OWASP, Network Security", "SECURITY"),
    
    # AI, ML & Data
    ("AI / Machine Learning Engineer", "Python, PyTorch, Hugging Face, LLMs, LangChain, Vector DBs, FastAPI", "AI"),
    ("Data Engineer (Airflow & Snowflake)", "Python, SQL, Apache Airflow, Snowflake, dbt, Spark, Data Warehousing", "DATA"),
    ("Senior Data Analyst & BI Developer", "SQL, Python, Power BI, Tableau, Statistical Modeling, Excel", "DATA"),
    ("Natural Language Processing (NLP) Specialist", "Transformers, spaCy, NLTK, Prompt Engineering, Retrieval-Augmented Generation (RAG)", "AI"),
    
    # QA & Product
    ("Lead QA Automation Engineer", "Cypress, Playwright, Selenium, TypeScript, Jest, API Testing, Postman", "QA"),
    ("Senior Quality Assurance (Manual & API)", "Postman, Swagger, Test Plans, JIRA, Regression Testing, SQL", "QA"),
    ("Technical Product Manager", "Product Roadmap, Agile/Scrum, User Stories, Data Analytics, Jira, Stakeholder Alignment", "PRODUCT"),
    ("Agile Scrum Master & Delivery Lead", "Scrum, Kanban, Sprint Planning, Agile Coaching, Jira, Confluence", "PRODUCT"),
]

LOCATIONS = [
    "Kathmandu, Nepal",
    "Lalitpur, Nepal",
    "Pokhara, Nepal",
    "Bhaktapur, Nepal",
    "Chitwan, Nepal",
    "Biratnagar, Nepal",
    "Butwal, Nepal",
    "Remote (Nepal)",
    "Remote (Global)",
    "Hybrid (Kathmandu)",
    "Hybrid (Lalitpur)",
]

SALARY_RANGES = [
    "NPR 60,000 - 100,000 / month",
    "NPR 90,000 - 150,000 / month",
    "NPR 120,000 - 200,000 / month",
    "NPR 160,000 - 250,000 / month",
    "NPR 200,000 - 350,000 / month",
    "NPR 35,000 - 55,000 / month",
    "NPR 20,000 - 35,000 / month (Internship)",
    "$2,000 - $3,800 / month",
    "$3,500 - $6,000 / month",
    "Negotiable based on experience",
    "Competitive salary + equity",
]

EMPLOYMENT_TYPES = [
    Job.EmploymentType.FULL_TIME,
    Job.EmploymentType.FULL_TIME,
    Job.EmploymentType.FULL_TIME,
    Job.EmploymentType.REMOTE,
    Job.EmploymentType.REMOTE,
    Job.EmploymentType.CONTRACT,
    Job.EmploymentType.PART_TIME,
    Job.EmploymentType.INTERNSHIP,
]


class Command(BaseCommand):
    help = "Seeds 1,000 realistic dummy job postings and dummy job applications into Jagir AI database."

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=1000,
            help='Number of dummy jobs to create (default: 1000)'
        )

    def handle(self, *args, **options):
        target_count = options['count']
        self.stdout.write(self.style.NOTICE(f"Starting seed process for {target_count} dummy jobs..."))

        # 1. Create or ensure recruiter accounts with profiles
        recruiter_users = []
        for name, desc, loc, web in COMPANIES:
            username = name.lower().replace(" ", "_").replace("&", "and")[:30]
            email = f"careers@{username}.com.np"
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': username,
                    'role': User.Role.JOB_RECRUITER,
                    'is_profile_setup': True,
                    'is_active': True,
                }
            )
            if created:
                user.set_password('password123')
                user.save()

            # Ensure RecruiterProfile exists
            profile, _ = RecruiterProfile.objects.get_or_create(
                user=user,
                defaults={
                    'company_name': name,
                    'company_description': desc,
                    'company_website': web,
                    'location': loc,
                }
            )
            if not profile.company_name:
                profile.company_name = name
                profile.company_description = desc
                profile.company_website = web
                profile.location = loc
                profile.save()

            recruiter_users.append(user)

        self.stdout.write(self.style.SUCCESS(f"Loaded {len(recruiter_users)} verified company recruiter accounts."))

        # 2. Ensure a pool of Job Seeker accounts for applications
        seeker_names = [
            ("sagar_dev", "sagar.dev@example.com"),
            ("ashim_engineer", "ashim.eng@example.com"),
            ("saharsha_b", "saharsha.b@example.com"),
            ("anita_shrestha", "anita.s@example.com"),
            ("bikash_karki", "bikash.k@example.com"),
            ("pramod_adhikari", "pramod.a@example.com"),
            ("roshani_thapa", "roshani.t@example.com"),
            ("siddhartha_lama", "siddhartha.l@example.com"),
            ("puja_gurung", "puja.g@example.com"),
            ("manish_poudel", "manish.p@example.com"),
            ("deepak_bhattarai", "deepak.b@example.com"),
            ("shreya_joshi", "shreya.j@example.com"),
            ("nabin_sharma", "nabin.s@example.com"),
            ("kriti_acharya", "kriti.a@example.com"),
            ("sunil_khadka", "sunil.k@example.com"),
        ]

        seeker_users = []
        # Also include existing job seekers
        existing_seekers = list(User.objects.filter(role=User.Role.JOB_SEEKER))
        seeker_users.extend(existing_seekers)

        for u_name, u_email in seeker_names:
            u, created = User.objects.get_or_create(
                email=u_email,
                defaults={
                    'username': u_name,
                    'role': User.Role.JOB_SEEKER,
                    'is_profile_setup': True,
                    'is_active': True,
                }
            )
            if created:
                u.set_password('password123')
                u.save()
                JobSeekerProfile.objects.get_or_create(
                    user=u,
                    defaults={
                        'bio': 'Passionate software engineer focused on building robust applications.',
                        'skills': 'Python, React, TypeScript, SQL, Docker, Git',
                        'location': 'Kathmandu, Nepal',
                    }
                )
            if u not in seeker_users:
                seeker_users.append(u)

        self.stdout.write(self.style.SUCCESS(f"Active job seeker accounts pool: {len(seeker_users)}"))

        # 3. Generate Jobs in batches
        existing_job_count = Job.objects.count()
        jobs_needed = max(0, target_count - existing_job_count)

        if jobs_needed <= 0:
            self.stdout.write(self.style.WARNING(f"Database already contains {existing_job_count} jobs (target: {target_count})."))
        else:
            self.stdout.write(self.style.NOTICE(f"Generating {jobs_needed} dummy job postings..."))

            now = timezone.now()
            jobs_to_create = []

            for i in range(jobs_needed):
                recruiter = random.choice(recruiter_users)
                title, skills_text, domain = random.choice(TITLES_BY_DOMAIN)
                
                # Suffix variations for natural diversity
                level = random.choice(["", " (Senior)", " (Mid-Level)", " (Lead)", " (Junior)", " (Contract)"])
                clean_title = f"{title.split(' (')[0]}{level}" if level else title

                location = random.choice(LOCATIONS)
                salary = random.choice(SALARY_RANGES)
                emp_type = random.choice(EMPLOYMENT_TYPES)
                
                # Random created date over the past 30 days to ensure natural timeline
                days_ago = random.randint(0, 30)
                hours_ago = random.randint(0, 23)
                mins_ago = random.randint(0, 59)
                created_dt = now - timedelta(days=days_ago, hours=hours_ago, minutes=mins_ago)
                deadline = (created_dt + timedelta(days=random.randint(20, 60))).date()

                desc = (
                    f"We are looking for an experienced and driven {clean_title} to join our growing team. "
                    f"In this role, you will collaborate with cross-functional teams to design, architect, and deliver "
                    f"scalable solutions that directly impact our customers and partners.\n\n"
                    f"You will have the opportunity to work with cutting-edge tools including {skills_text}. "
                    f"We foster a culture of technical excellence, continuous learning, and open collaboration."
                )

                requirements = (
                    f"• Proven track record in developing enterprise software with {skills_text.split(',')[0]} and modern frameworks.\n"
                    f"• Solid understanding of software design principles, algorithms, and clean architecture.\n"
                    f"• Hands-on experience with databases (SQL/NoSQL) and RESTful/GraphQL APIs.\n"
                    f"• Excellent problem-solving skills and comfort working in fast-paced Agile environments.\n"
                    f"• Strong communication skills and ability to mentor junior engineers."
                )

                responsibilities = (
                    f"• Design, build, and maintain efficient, reusable, and reliable code.\n"
                    f"• Collaborate closely with product managers, UX designers, and QA engineers.\n"
                    f"• Conduct code reviews and ensure engineering standards and best practices.\n"
                    f"• Troubleshoot, debug, and optimize application performance across production environments.\n"
                    f"• Actively participate in sprint planning, retrospectives, and architecture discussions."
                )

                job = Job(
                    recruiter=recruiter,
                    title=clean_title,
                    description=desc,
                    requirements=requirements,
                    responsibilities=responsibilities,
                    location=location,
                    salary=salary,
                    employment_type=emp_type,
                    deadline=deadline,
                    status=Job.JobStatus.ACTIVE,
                )
                jobs_to_create.append(job)

            # Bulk create jobs
            Job.objects.bulk_create(jobs_to_create, batch_size=250)
            self.stdout.write(self.style.SUCCESS(f"Successfully created {len(jobs_to_create)} new jobs!"))

        total_jobs = Job.objects.count()
        self.stdout.write(self.style.SUCCESS(f"Total jobs currently in database: {total_jobs}"))

        # 4. Generate dummy job applications connecting seekers to jobs
        self.stdout.write(self.style.NOTICE("Creating dummy job applications for realistic dashboard statistics..."))
        all_jobs = list(Job.objects.all()[:300]) # Sample from top 300 jobs
        existing_app_pairs = set(Application.objects.values_list('job_id', 'applicant_id'))

        applications_to_create = []
        statuses = [
            Application.ApplicationStatus.APPLIED,
            Application.ApplicationStatus.APPLIED,
            Application.ApplicationStatus.SHORTLISTED,
            Application.ApplicationStatus.INTERVIEW,
            Application.ApplicationStatus.HIRED,
            Application.ApplicationStatus.REJECTED,
        ]

        target_app_count = 150
        created_apps = 0

        for _ in range(target_app_count * 2):
            if created_apps >= target_app_count:
                break
            job = random.choice(all_jobs)
            seeker = random.choice(seeker_users)
            pair = (job.id, seeker.id)
            if pair in existing_app_pairs:
                continue

            existing_app_pairs.add(pair)
            status_choice = random.choice(statuses)
            cover_letter = (
                f"Dear Hiring Team at {job.recruiter.username},\n\n"
                f"I am writing to express my strong interest in the {job.title} vacancy. "
                f"With my technical background and hands-on experience in building scalable solutions, "
                f"I am confident in delivering high impact for your team.\n\n"
                f"Best regards,\n{seeker.username}"
            )

            app = Application(
                job=job,
                applicant=seeker,
                cover_letter=cover_letter,
                status=status_choice,
            )
            applications_to_create.append(app)
            created_apps += 1

        if applications_to_create:
            Application.objects.bulk_create(applications_to_create, batch_size=100)
            self.stdout.write(self.style.SUCCESS(f"Created {len(applications_to_create)} dummy job applications!"))

        total_apps = Application.objects.count()
        self.stdout.write(self.style.SUCCESS(f"Total job applications currently in database: {total_apps}"))
        self.stdout.write(self.style.SUCCESS("All dummy jobs and applications seeded successfully!"))
