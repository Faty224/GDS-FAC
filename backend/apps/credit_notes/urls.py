from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.credit_notes.views import CreditNoteViewSet

router = DefaultRouter()
router.register(r'', CreditNoteViewSet, basename='credit-note')

urlpatterns = [
    path('', include(router.urls)),
]
