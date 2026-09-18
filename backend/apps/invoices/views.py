from django.db import transaction
from django.utils import timezone
from django.http import HttpResponse
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.invoices.models import Invoice, InvoiceStatus, ETVAStatus
from apps.invoices.serializers import InvoiceSerializer
from apps.invoices.pdf import generate_invoice_pdf
from apps.billing.models import BillingSettings
from apps.accounts.permissions import IsFacturierOrAdminRole, IsReadOnlyRole
from apps.audit.models import AuditLog

class InvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated, IsReadOnlyRole]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['number', 'customer__name', 'customer__nifp']
    ordering_fields = ['id', 'number', 'date', 'total_ttc', 'created_at']

    def get_queryset(self):
        user = self.request.user
        qs = Invoice.objects.select_related('customer', 'company').prefetch_related('items').all()
        if not user.is_superuser and user.company:
            qs = qs.filter(company=user.company)

        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param.upper())

        customer_id = self.request.query_params.get('customer')
        if customer_id:
            qs = qs.filter(customer_id=customer_id)

        return qs

    def perform_destroy(self, instance):
        if instance.status != InvoiceStatus.DRAFT:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'detail': 'Seules les factures au statut Brouillon peuvent être supprimées.'})
        instance.delete()

    @action(detail=True, methods=['post'])
    def validate(self, request, pk=None):
        invoice = self.get_object()

        if invoice.status != InvoiceStatus.DRAFT:
            return Response({'detail': f'La facture est déjà au statut {invoice.get_status_display()}.'}, status=status.HTTP_400_BAD_REQUEST)

        if not invoice.items.exists():
            return Response({'detail': 'La facture doit contenir au moins une ligne.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Get or create billing settings to generate secure sequential number
            billing_settings = BillingSettings.objects.filter(company=invoice.company, is_active=True).first()
            if not billing_settings:
                billing_settings = BillingSettings.objects.create(
                    company=invoice.company,
                    prefix='FAC-2026-',
                    next_number=1
                )

            next_num = billing_settings.next_number
            official_number = f"{billing_settings.prefix}{next_num:04d}"
            billing_settings.next_number += 1
            billing_settings.save(update_fields=['next_number'])

            invoice.number = official_number
            invoice.status = InvoiceStatus.VALIDATED
            invoice.recalculate_totals()
            invoice.save()

            # Record audit event
            AuditLog.objects.create(
                user=request.user,
                action='VALIDATE_INVOICE',
                entity_name='Facture',
                entity_id=invoice.id,
                ip_address=request.META.get('REMOTE_ADDR', ''),
                details={'number': invoice.number, 'total_ttc': str(invoice.total_ttc), 'company_id': getattr(invoice.company, 'id', None)}
            )

        return Response(InvoiceSerializer(invoice).data)

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        invoice = self.get_object()
        pdf_bytes = generate_invoice_pdf(invoice)
        filename = f"facture-{invoice.number or 'brouillon'}.pdf"
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        return response

    @action(detail=True, methods=['post'])
    def transmit_etva(self, request, pk=None):
        invoice = self.get_object()
        
        if invoice.status == InvoiceStatus.DRAFT:
            return Response({'detail': 'La facture doit être validée avant transmission.'}, status=status.HTTP_400_BAD_REQUEST)

        from apps.etva.services import ETVAService
        transmission = ETVAService.transmit_invoice(invoice, user=request.user)

        return Response({
            'invoice_id': invoice.id,
            'status': invoice.status,
            'etva_status': invoice.etva_status,
            'transmission_id': transmission.id if transmission else None,
            'message': 'Opération de transmission effectuée avec succès.'
        })
