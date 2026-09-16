from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.billing.views import BillingSettingsViewSet, active_billing_settings_view

router = DefaultRouter()
router.register(r'list', BillingSettingsViewSet, basename='billing-settings-list')

urlpatterns = [
    path('active/', active_billing_settings_view, name='active-billing-settings'),
    path('', include(router.urls)),
]
