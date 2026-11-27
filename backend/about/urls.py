from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AboutPageSummaryView,
    AboutGalleryViewSet,
    AboutSectionItemViewSet,
    ResetDefaultAboutDataView
)

router = DefaultRouter()
router.register(r'gallery', AboutGalleryViewSet, basename='about-gallery')
router.register(r'sections', AboutSectionItemViewSet, basename='about-sections')

urlpatterns = [
    path('', AboutPageSummaryView.as_view(), name='about-summary'),
    path('reset_defaults/', ResetDefaultAboutDataView.as_view(), name='about-reset-defaults'),
    path('', include(router.urls)),
]

