from django.db import models


class AboutGalleryItem(models.Model):
    """
    Showcase photos & visual stories displayed in the About Us gallery.
    Users can click any photo to open a 'View Contents' lightbox with full image and story.
    """
    title = models.CharField(max_length=255, help_text="Headline or title of the photo")
    caption = models.CharField(max_length=255, blank=True, help_text="Short subtitle on the card")
    description = models.TextField(
        blank=True,
        help_text="Detailed story or contents displayed when the visitor clicks 'View Contents'"
    )
    category = models.CharField(
        max_length=100,
        default='Culture',
        help_text="e.g. Culture, Team, Events, Office, Community"
    )
    image = models.ImageField(upload_to='about_gallery/', blank=True, null=True)
    image_url = models.URLField(
        max_length=1000,
        blank=True,
        help_text="Direct external image URL (e.g. Unsplash, CDN)"
    )
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', '-created_at']
        verbose_name = 'About Gallery Item'
        verbose_name_plural = 'About Gallery Items'

    def __str__(self):
        return f"{self.title} ({self.category})"

    @property
    def effective_image(self):
        if self.image:
            try:
                return self.image.url
            except Exception:
                pass
        return self.image_url or ''


class AboutSectionItem(models.Model):
    """
    Manageable sections and icons on the About Us page (Stats, Mission, Vision, Values, Steps).
    All icons and content are editable via the Admin Panel.
    """
    SECTION_TYPES = [
        ('STAT', 'Statistics Counter'),
        ('MISSION', 'Our Mission'),
        ('VISION', 'Our Vision'),
        ('VALUE', 'Core Value'),
        ('STEP', 'How It Works Step'),
    ]

    section_type = models.CharField(max_length=20, choices=SECTION_TYPES)
    title = models.CharField(max_length=255, help_text="e.g. Active Job Listings, Our Mission, Integrity & Verification")
    subtitle_or_value = models.CharField(
        max_length=255,
        blank=True,
        help_text="Metric value for stats (e.g. 5,000+), tag/badge for values (e.g. 100% Verified, Core Purpose), or step number (01)"
    )
    description = models.TextField(
        blank=True,
        help_text="Detailed explanation for mission, vision, core value, or step"
    )
    icon = models.CharField(
        max_length=100,
        default='Sparkles',
        help_text="Lucide icon name (e.g. Briefcase, Building2, Users, Award, Target, Compass, ShieldCheck, Sparkles, TrendingUp, Zap, Heart, Star, CheckCircle2, Globe, Rocket)"
    )
    custom_icon = models.ImageField(
        upload_to='about_icons/',
        blank=True,
        null=True,
        help_text="Upload a custom photo or icon image (PNG, SVG, JPG, WebP)"
    )
    custom_icon_url = models.URLField(
        max_length=1000,
        blank=True,
        help_text="Or external custom icon/image URL"
    )
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['section_type', 'display_order', 'id']
        verbose_name = 'About Section Item'
        verbose_name_plural = 'About Section Items'

    def __str__(self):
        return f"[{self.get_section_type_display()}] {self.title}"

    @property
    def effective_custom_icon(self):
        if self.custom_icon:
            try:
                return self.custom_icon.url
            except Exception:
                pass
        return self.custom_icon_url or ''

