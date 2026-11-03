from django.db.models import Q, F
from django.http import Http404
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import BlogPost
from .serializers import BlogPostSerializer
from users.permissions import IsSuperAdminUser


class BlogPostViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Blog management:
    - Public visitors / seekers: Read published blog posts
    - Admin users: Full CRUD (Create, Read, Update, Delete)
    - Supports slug or ID lookup
    """
    serializer_class = BlogPostSerializer
    lookup_field = 'slug'

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'increment_view', 'categories']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsSuperAdminUser()]

    def get_queryset(self):
        user = self.request.user
        queryset = BlogPost.objects.select_related('author')

        # Admin users can see all posts (drafts + published)
        is_admin = user and user.is_authenticated and (user.is_staff or user.is_superuser)

        if not is_admin:
            queryset = queryset.filter(status=BlogPost.Status.PUBLISHED)
        else:
            status_param = self.request.query_params.get('status')
            if status_param and status_param.upper() in [s[0] for s in BlogPost.Status.choices]:
                queryset = queryset.filter(status=status_param.upper())

        # Category filter
        category_param = self.request.query_params.get('category')
        if category_param and category_param.strip() and category_param.lower() != 'all':
            queryset = queryset.filter(category__iexact=category_param.strip())

        # Search filter
        search_query = self.request.query_params.get('search')
        if search_query:
            search_query = search_query.strip()
            queryset = queryset.filter(
                Q(title__icontains=search_query) |
                Q(excerpt__icontains=search_query) |
                Q(content__icontains=search_query) |
                Q(tags__icontains=search_query) |
                Q(author_name__icontains=search_query)
            )

        return queryset.order_by('-published_at', '-created_at')

    def get_object(self):
        lookup = self.kwargs.get(self.lookup_field)
        queryset = self.filter_queryset(self.get_queryset())

        obj = None
        if lookup.isdigit():
            obj = queryset.filter(Q(id=int(lookup)) | Q(slug=lookup)).first()
        else:
            obj = queryset.filter(slug=lookup).first()

        if not obj:
            raise Http404("Blog post not found.")

        self.check_object_permissions(self.request, obj)
        return obj

    @action(detail=True, methods=['post'], permission_classes=[permissions.AllowAny])
    def increment_view(self, request, slug=None):
        """Atomically increment the blog post view counter."""
        post = self.get_object()
        BlogPost.objects.filter(pk=post.pk).update(views_count=F('views_count') + 1)
        post.refresh_from_db(fields=['views_count'])
        return Response({'views_count': post.views_count})

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def categories(self, request):
        """Return list of distinct categories currently used in published posts."""
        cats = (
            BlogPost.objects.filter(status=BlogPost.Status.PUBLISHED)
            .values_list('category', flat=True)
            .distinct()
        )
        # Clean and remove empty
        unique_cats = sorted(list({c.strip() for c in cats if c and c.strip()}))
        return Response(unique_cats)

