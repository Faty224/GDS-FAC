from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.etva.views import ETVATransmissionViewSet, etva_config_status_view

router = DefaultRouter()
router.register(r'logs', ETVATransmissionViewSet, basename='etva-logs')

urlpatterns = [
    path('config/', etva_config_status_view, name='etva-config-status'),
    path('', include(router.urls)),
]
