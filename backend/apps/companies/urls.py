from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.companies.views import CompanyViewSet, current_company_view

router = DefaultRouter()
router.register(r'list', CompanyViewSet, basename='company-list')

urlpatterns = [
    path('', current_company_view, name='current-company'),
    path('', include(router.urls)),
]
