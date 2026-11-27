import math
from django.db import models
from django.conf import settings
from django.utils.text import slugify
from django.utils import timezone


class BlogPost(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        PUBLISHED = 'PUBLISHED', 'Published'

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=280, unique=True, blank=True)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='blog_posts'
    )
    author_name = models.CharField(
        max_length=150,
        blank=True,
        help_text="Custom display author name (e.g. Editorial Team)"
    )
    category = models.CharField(
        max_length=100,
        default='Career Advice',
        blank=True,
        db_index=True
    )
    cover_image = models.ImageField(
        upload_to='blog_covers/',
        null=True,
        blank=True
    )
    cover_image_url = models.URLField(
        max_length=1000,
        blank=True,
        help_text="External cover image link (e.g. Unsplash URL)"
    )
    excerpt = models.TextField(
        blank=True,
        help_text="Short summary displayed on blog cards and previews"
    )
    content = models.TextField(
        help_text="Full blog post content (supports Markdown or formatted text)"
    )
    tags = models.CharField(
        max_length=255,
        blank=True,
        help_text="Comma-separated keywords or topics (e.g. Tech, Interview, Nepal)"
    )
    read_time = models.PositiveIntegerField(
        default=5,
        help_text="Estimated reading time in minutes"
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PUBLISHED,
        db_index=True
    )
    views_count = models.PositiveIntegerField(
        default=0
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Blog Post'
        verbose_name_plural = 'Blog Posts'
        ordering = ['-published_at', '-created_at']

    def save(self, *args, **kwargs):
        # 1. Unique slug generation
        if not self.slug:
            base_slug = slugify(self.title) or 'post'
            slug = base_slug
            counter = 1
            while BlogPost.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug

        # 2. Auto author name
        if not self.author_name:
            if self.author:
                self.author_name = self.author.username
            else:
                self.author_name = "Jagir AI Team"

        # 3. Auto calculate read time if not explicitly provided
        if not self.read_time or self.read_time == 0:
            word_count = len(self.content.split())
            self.read_time = max(1, math.ceil(word_count / 200))

        # 4. Auto generate excerpt if empty
        if not self.excerpt and self.content:
            clean_text = self.content.replace('#', '').replace('*', '').strip()
            self.excerpt = clean_text[:220] + ('...' if len(clean_text) > 220 else '')

        # 5. Published timestamp
        if self.status == self.Status.PUBLISHED and not self.published_at:
            self.published_at = timezone.now()

        super().save(*args, **kwargs)

    @property
    def effective_cover_image(self):
        """Returns the media URL if a file was uploaded, else the external URL, or None."""
        if self.cover_image:
            return self.cover_image.url
        if self.cover_image_url:
            return self.cover_image_url
        return None

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"

