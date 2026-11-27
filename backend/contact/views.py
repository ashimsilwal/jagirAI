from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from .models import ContactMessage
from .serializers import (
    ContactMessageCreateSerializer,
    ContactMessageSerializer,
    ContactMessageUpdateSerializer
)


class ContactSubmitView(generics.CreateAPIView):
    """
    Public endpoint for visitors & users to submit contact inquiries.
    """
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageCreateSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response(
            {
                "success": True,
                "message": "Thank you! Your message has been received. Our team will get back to you shortly.",
                "id": instance.id,
            },
            status=status.HTTP_201_CREATED
        )


class AdminContactListView(generics.ListAPIView):
    """
    Admin-only endpoint to view, search, and filter contact inquiries.
    """
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = ContactMessage.objects.all().select_related('resolved_by')

        status_param = self.request.query_params.get('status')
        if status_param and status_param.upper() in ContactMessage.Status.values:
            qs = qs.filter(status=status_param.upper())

        category_param = self.request.query_params.get('category')
        if category_param and category_param.upper() in ContactMessage.Category.values:
            qs = qs.filter(category=category_param.upper())

        search_param = self.request.query_params.get('search')
        if search_param:
            search_param = search_param.strip()
            qs = qs.filter(
                Q(name__icontains=search_param) |
                Q(email__icontains=search_param) |
                Q(subject__icontains=search_param) |
                Q(message__icontains=search_param)
            )

        return qs.order_by('-created_at')


class AdminContactDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Admin-only endpoint to retrieve, update status/notes, or delete a contact message.
    Automatically marks UNREAD messages as READ on retrieve.
    """
    queryset = ContactMessage.objects.all().select_related('resolved_by')
    permission_classes = [permissions.IsAdminUser]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ContactMessageUpdateSerializer
        return ContactMessageSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Auto-mark as READ if currently UNREAD
        if instance.status == ContactMessage.Status.UNREAD:
            instance.status = ContactMessage.Status.READ
            instance.save(update_fields=['status', 'updated_at'])
        serializer = ContactMessageSerializer(instance)
        return Response(serializer.data)

    def perform_update(self, serializer):
        new_status = serializer.validated_data.get('status')
        resolved_by = self.request.user if new_status == ContactMessage.Status.RESOLVED else None
        if resolved_by:
            serializer.save(resolved_by=resolved_by)
        else:
            serializer.save()


class AdminContactStatsView(APIView):
    """
    Admin endpoint returning aggregate counts for contact inquiries.
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        total = ContactMessage.objects.count()
        unread = ContactMessage.objects.filter(status=ContactMessage.Status.UNREAD).count()
        read = ContactMessage.objects.filter(status=ContactMessage.Status.READ).count()
        resolved = ContactMessage.objects.filter(status=ContactMessage.Status.RESOLVED).count()
        archived = ContactMessage.objects.filter(status=ContactMessage.Status.ARCHIVED).count()

        return Response({
            "total": total,
            "unread": unread,
            "read": read,
            "resolved": resolved,
            "archived": archived,
        })


class AdminContactMarkAllReadView(APIView):
    """
    Admin endpoint to mark all UNREAD messages as READ.
    """
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        updated_count = ContactMessage.objects.filter(
            status=ContactMessage.Status.UNREAD
        ).update(status=ContactMessage.Status.READ)

        return Response({
            "success": True,
            "updated": updated_count
        })

