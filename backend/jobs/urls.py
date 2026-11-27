from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import JobViewSet, JobCategoryViewSet, JobCategoryRequestViewSet

router = DefaultRouter()
router.register(r'jobs', JobViewSet, basename='job')
router.register(r'job-categories', JobCategoryViewSet, basename='job-category')
router.register(r'job-category-requests', JobCategoryRequestViewSet, basename='job-category-request')

urlpatterns = [
    path('', include(router.urls)),
]
