from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ApplicationViewSet, NotificationViewSet

router = DefaultRouter()
router.register(r'applications', ApplicationViewSet, basename='application')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]
