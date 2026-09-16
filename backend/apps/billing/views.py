from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from apps.billing.models import BillingSettings
from apps.billing.serializers import BillingSettingsSerializer
from apps.accounts.permissions import IsFacturierOrAdminRole, IsReadOnlyRole

class BillingSettingsViewSet(viewsets.ModelViewSet):
    serializer_class = BillingSettingsSerializer
    permission_classes = [permissions.IsAuthenticated, IsReadOnlyRole]

    def get_queryset(self):
        user = self.request.user
        qs = BillingSettings.objects.all()
        if not user.is_superuser and user.company:
            qs = qs.filter(company=user.company)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(company=user.company)

@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def active_billing_settings_view(request):
    user = request.user
    company = user.company
    
    settings_obj = BillingSettings.objects.filter(company=company, is_active=True).first()
    if not settings_obj:
        settings_obj = BillingSettings.objects.create(
            company=company,
            title='Paramétrage Standard',
            prefix='FAC-2026-',
            credit_note_prefix='AV-2026-',
            next_number=1,
            next_credit_note_number=1,
            default_currency='GNF',
            default_vat_rate=18.00
        )

    if request.method == 'GET':
        return Response(BillingSettingsSerializer(settings_obj).data)

    serializer = BillingSettingsSerializer(settings_obj, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)
