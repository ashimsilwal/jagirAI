from rest_framework import serializers
from .models import AboutGalleryItem, AboutSectionItem


class AboutGalleryItemSerializer(serializers.ModelSerializer):
    effective_image = serializers.SerializerMethodField()

    class Meta:
        model = AboutGalleryItem
        fields = [
            'id',
            'title',
            'caption',
            'description',
            'category',
            'image',
            'image_url',
            'effective_image',
            'display_order',
            'is_active',
            'created_at',
            'updated_at',
        ]

    def get_effective_image(self, obj):
        request = self.context.get('request')
        if obj.image:
            try:
                if request:
                    return request.build_absolute_uri(obj.image.url)
                return obj.image.url
            except Exception:
                pass
        return obj.image_url or ''


class AboutSectionItemSerializer(serializers.ModelSerializer):
    effective_custom_icon = serializers.SerializerMethodField()

    class Meta:
        model = AboutSectionItem
        fields = [
            'id',
            'section_type',
            'title',
            'subtitle_or_value',
            'description',
            'icon',
            'custom_icon',
            'custom_icon_url',
            'effective_custom_icon',
            'display_order',
            'is_active',
            'created_at',
            'updated_at',
        ]

    def get_effective_custom_icon(self, obj):
        request = self.context.get('request')
        if obj.custom_icon:
            try:
                if request:
                    return request.build_absolute_uri(obj.custom_icon.url)
                return obj.custom_icon.url
            except Exception:
                pass
        return obj.custom_icon_url or ''

