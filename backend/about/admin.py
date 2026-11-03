from django.contrib import admin
from .models import AboutGalleryItem, AboutSectionItem


@admin.register(AboutGalleryItem)
class AboutGalleryItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'display_order', 'is_active', 'created_at')
    list_filter = ('category', 'is_active')
    search_fields = ('title', 'caption', 'description')
    ordering = ('display_order', '-created_at')


@admin.register(AboutSectionItem)
class AboutSectionItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'section_type', 'subtitle_or_value', 'icon', 'display_order', 'is_active')
    list_filter = ('section_type', 'is_active')
    search_fields = ('title', 'subtitle_or_value', 'description', 'icon')
    ordering = ('section_type', 'display_order', 'id')

