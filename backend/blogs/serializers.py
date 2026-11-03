from rest_framework import serializers
from .models import BlogPost
from users.serializers import UserSerializer


class BlogPostSerializer(serializers.ModelSerializer):
    author_details = UserSerializer(source='author', read_only=True)
    effective_cover_image = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = [
            'id',
            'title',
            'slug',
            'author',
            'author_details',
            'author_name',
            'category',
            'cover_image',
            'cover_image_url',
            'effective_cover_image',
            'excerpt',
            'content',
            'tags',
            'read_time',
            'status',
            'views_count',
            'created_at',
            'updated_at',
            'published_at',
        ]
        read_only_fields = ['id', 'views_count', 'created_at', 'updated_at', 'published_at']

    def get_effective_cover_image(self, obj):
        request = self.context.get('request')
        if obj.cover_image:
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return obj.cover_image.url
        if obj.cover_image_url:
            return obj.cover_image_url
        return None

    def create(self, validated_data):
        request = self.context.get('request')
        # If author wasn't explicitly supplied, default to the authenticated admin
        if 'author' not in validated_data and request and request.user.is_authenticated:
            validated_data['author'] = request.user
        return super().create(validated_data)

