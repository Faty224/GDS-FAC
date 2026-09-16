from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.conf import settings

from apps.etva.models import ETVATransmission
from apps.etva.serializers import ETVATransmissionSerializer
from apps.accounts.permissions import IsReadOnlyRole

class ETVATransmissionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ETVATransmissionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['external_reference', 'response_message', 'invoice__number', 'credit_note__number']
    ordering_fields = ['id', 'transmitted_at', 'status', 'environment']

    def get_queryset(self):
        user = self.request.user
        qs = ETVATransmission.objects.all()
        if not user.is_superuser and user.company:
            qs = qs.filter(company=user.company)
        return qs

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def etva_config_status_view(request):
    """Retourne la configuration actuelle eTVA de l'environnement."""
    return Response({
        'environment': getattr(settings, 'ETVA_ENVIRONMENT', 'SANDBOX'),
        'base_url': getattr(settings, 'ETVA_BASE_URL', ''),
        'has_client_credentials': bool(getattr(settings, 'ETVA_CLIENT_ID', '') and getattr(settings, 'ETVA_CLIENT_SECRET', '')),
        'status': 'OPERATIONAL_SANDBOX' if getattr(settings, 'ETVA_ENVIRONMENT', 'SANDBOX') == 'SANDBOX' else 'READY_FOR_INTEGRATION'
    })
