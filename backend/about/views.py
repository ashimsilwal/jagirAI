from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import AboutGalleryItem, AboutSectionItem
from .serializers import AboutGalleryItemSerializer, AboutSectionItemSerializer


DEFAULT_STATS = [
    {'title': 'Active Job Listings', 'subtitle_or_value': '5,000+', 'icon': 'Briefcase', 'display_order': 1},
    {'title': 'Partner Companies', 'subtitle_or_value': '450+', 'icon': 'Building2', 'display_order': 2},
    {'title': 'Registered Candidates', 'subtitle_or_value': '35,000+', 'icon': 'Users', 'display_order': 3},
    {'title': 'Successful Placements', 'subtitle_or_value': '12,000+', 'icon': 'Award', 'display_order': 4},
]

DEFAULT_MISSION = {
    'title': 'Our Mission',
    'subtitle_or_value': 'Core Purpose',
    'description': (
        'To empower individuals to discover fulfilling careers without friction and equip '
        'employers with intelligent tools to hire the best talent faster, objectively, and with complete transparency.'
    ),
    'icon': 'Target',
    'display_order': 1,
}

DEFAULT_VISION = {
    'title': 'Our Vision',
    'subtitle_or_value': 'Long-Term Outlook',
    'description': (
        'To build South Asia\'s most trusted, AI-accelerated career marketplace, fundamentally '
        'transforming how organizations scale and how ambitious individuals unlock their true potential across emerging economies.'
    ),
    'icon': 'Compass',
    'display_order': 2,
}

DEFAULT_VALUES = [
    {
        'title': 'Integrity & Verification',
        'subtitle_or_value': '100% Verified',
        'description': 'We rigorously verify employers and job openings so candidates never encounter spam, scams, or phantom vacancies.',
        'icon': 'ShieldCheck',
        'display_order': 1,
    },
    {
        'title': 'Intelligent Matching',
        'subtitle_or_value': 'AI-Powered',
        'description': 'Our proprietary algorithm analyzes skills, experience, and role requirements to surface the best-fit opportunities in seconds.',
        'icon': 'Sparkles',
        'display_order': 2,
    },
    {
        'title': 'Human-Centered Growth',
        'subtitle_or_value': 'People First',
        'description': 'Technology powers our platform, but people drive our purpose. We champion equal opportunities and career advancement.',
        'icon': 'Users',
        'display_order': 3,
    },
    {
        'title': 'Transparency in Hiring',
        'subtitle_or_value': 'Clear Tracking',
        'description': 'From clear salary indicators to live applicant milestones, we bring complete clarity to the modern recruitment cycle.',
        'icon': 'TrendingUp',
        'display_order': 4,
    },
]

DEFAULT_STEPS = [
    {
        'title': 'Create Your Profile',
        'subtitle_or_value': '01',
        'description': 'Highlight your technical abilities, projects, and career preferences with a modern candidate portfolio.',
        'icon': 'UserCheck',
        'display_order': 1,
    },
    {
        'title': 'Discover & Get Matched',
        'subtitle_or_value': '02',
        'description': 'Browse tailored positions or let our recommendation engine connect you with forward-thinking employers.',
        'icon': 'Compass',
        'display_order': 2,
    },
    {
        'title': 'Apply & Track Directly',
        'subtitle_or_value': '03',
        'description': 'Submit your resume with a single click and receive real-time status updates at every stage of the review.',
        'icon': 'CheckCircle2',
        'display_order': 3,
    },
]

DEFAULT_GALLERY = [
    {
        'title': 'Kathmandu Innovation Hub & Office',
        'caption': 'Where technology meets recruitment innovation',
        'description': (
            'Our open-concept headquarters nestled in the heart of Kathmandu is designed for '
            'cross-functional collaboration, AI research breakthroughs, and welcoming industry partners.'
        ),
        'category': 'Office',
        'image_url': 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
        'display_order': 1,
    },
    {
        'title': 'Annual Jagir AI Tech Summit & Hackathon',
        'caption': 'Bringing together 500+ developers & recruiters',
        'description': (
            'Our flagship community event connecting software engineers, designers, and hiring managers '
            'from all seven provinces of Nepal to build next-generation talent and tech solutions.'
        ),
        'category': 'Events',
        'image_url': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
        'display_order': 2,
    },
    {
        'title': 'Candidate Mentorship & Interview Clinics',
        'caption': '1-on-1 resume reviews and career coaching',
        'description': (
            'Empowering university graduates and career changers across Nepal with portfolio polishing, '
            'mock technical interviews, and AI-assisted skill gap analysis.'
        ),
        'category': 'Community',
        'image_url': 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
        'display_order': 3,
    },
    {
        'title': 'Our Engineering & Talent Research Team',
        'caption': 'The builders powering fair hiring across South Asia',
        'description': (
            'A passionate, multidisciplinary group of software engineers, NLP researchers, and talent specialists '
            'dedicated to removing bias, eliminating ghost job listings, and accelerating career matches.'
        ),
        'category': 'Team',
        'image_url': 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
        'display_order': 4,
    },
]


def seed_default_about_data():
    """Ensure baseline data exists if tables are currently empty."""
    if not AboutSectionItem.objects.exists():
        for stat in DEFAULT_STATS:
            AboutSectionItem.objects.create(section_type='STAT', **stat)
        AboutSectionItem.objects.create(section_type='MISSION', **DEFAULT_MISSION)
        AboutSectionItem.objects.create(section_type='VISION', **DEFAULT_VISION)
        for val in DEFAULT_VALUES:
            AboutSectionItem.objects.create(section_type='VALUE', **val)
        for step in DEFAULT_STEPS:
            AboutSectionItem.objects.create(section_type='STEP', **step)

    if not AboutGalleryItem.objects.exists():
        for item in DEFAULT_GALLERY:
            AboutGalleryItem.objects.create(**item)


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and (request.user.is_staff or request.user.is_superuser))


class AboutPageSummaryView(APIView):
    """
    Public aggregated endpoint returning the complete about page content:
    stats, mission, vision, values, steps, and showcase gallery.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        seed_default_about_data()

        stats = AboutSectionItem.objects.filter(section_type='STAT', is_active=True).order_by('display_order', 'id')
        mission = AboutSectionItem.objects.filter(section_type='MISSION', is_active=True).first()
        vision = AboutSectionItem.objects.filter(section_type='VISION', is_active=True).first()
        values = AboutSectionItem.objects.filter(section_type='VALUE', is_active=True).order_by('display_order', 'id')
        steps = AboutSectionItem.objects.filter(section_type='STEP', is_active=True).order_by('display_order', 'id')
        gallery = AboutGalleryItem.objects.filter(is_active=True).order_by('display_order', '-created_at')

        context = {'request': request}
        return Response({
            'stats': AboutSectionItemSerializer(stats, many=True, context=context).data,
            'mission': AboutSectionItemSerializer(mission, context=context).data if mission else None,
            'vision': AboutSectionItemSerializer(vision, context=context).data if vision else None,
            'values': AboutSectionItemSerializer(values, many=True, context=context).data,
            'steps': AboutSectionItemSerializer(steps, many=True, context=context).data,
            'gallery': AboutGalleryItemSerializer(gallery, many=True, context=context).data,
        })


class AboutGalleryViewSet(viewsets.ModelViewSet):
    """
    CRUD ViewSet for managing About gallery photos & showcase contents.
    Public GET, Admin-only write/update/delete.
    """
    queryset = AboutGalleryItem.objects.all().order_by('display_order', '-created_at')
    serializer_class = AboutGalleryItemSerializer
    permission_classes = [IsAdminOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        if user and (user.is_staff or user.is_superuser):
            return AboutGalleryItem.objects.all().order_by('display_order', '-created_at')
        return AboutGalleryItem.objects.filter(is_active=True).order_by('display_order', '-created_at')


class AboutSectionItemViewSet(viewsets.ModelViewSet):
    """
    CRUD ViewSet for managing icons, statistics, mission, vision, values, and steps.
    Public GET, Admin-only write/update/delete.
    """
    queryset = AboutSectionItem.objects.all().order_by('section_type', 'display_order', 'id')
    serializer_class = AboutSectionItemSerializer
    permission_classes = [IsAdminOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        qs = AboutSectionItem.objects.all()
        section_type = self.request.query_params.get('section_type')
        if section_type:
            qs = qs.filter(section_type=section_type.upper())
        user = self.request.user
        if not (user and (user.is_staff or user.is_superuser)):
            qs = qs.filter(is_active=True)
        return qs.order_by('section_type', 'display_order', 'id')


class ResetDefaultAboutDataView(APIView):
    """
    Admin-only endpoint to re-seed or restore default Jagir AI about page items.
    """
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        # Force re-seed
        for stat in DEFAULT_STATS:
            AboutSectionItem.objects.get_or_create(
                section_type='STAT',
                title=stat['title'],
                defaults=stat
            )
        AboutSectionItem.objects.get_or_create(
            section_type='MISSION',
            title=DEFAULT_MISSION['title'],
            defaults=DEFAULT_MISSION
        )
        AboutSectionItem.objects.get_or_create(
            section_type='VISION',
            title=DEFAULT_VISION['title'],
            defaults=DEFAULT_VISION
        )
        for val in DEFAULT_VALUES:
            AboutSectionItem.objects.get_or_create(
                section_type='VALUE',
                title=val['title'],
                defaults=val
            )
        for step in DEFAULT_STEPS:
            AboutSectionItem.objects.get_or_create(
                section_type='STEP',
                title=step['title'],
                defaults=step
            )
        for item in DEFAULT_GALLERY:
            AboutGalleryItem.objects.get_or_create(
                title=item['title'],
                defaults=item
            )
        return Response({'message': 'Default About page content restored successfully.'}, status=status.HTTP_200_OK)

