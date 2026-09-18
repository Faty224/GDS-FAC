from django.db import transaction
from django.utils import timezone
from django.http import HttpResponse
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.credit_notes.models import CreditNote
from apps.credit_notes.serializers import CreditNoteSerializer
from apps.credit_notes.pdf import generate_credit_note_pdf
from apps.invoices.models import InvoiceStatus, Invoice
from apps.billing.models import BillingSettings
from apps.accounts.permissions import IsFacturierOrAdminRole, IsReadOnlyRole
from apps.audit.models import AuditLog

class CreditNoteViewSet(viewsets.ModelViewSet):
    serializer_class = CreditNoteSerializer
    permission_classes = [permissions.IsAuthenticated, IsReadOnlyRole]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['number', 'parent_invoice__number', 'customer__name']
    ordering_fields = ['id', 'number', 'date', 'total_ttc', 'created_at']

    def get_queryset(self):
        user = self.request.user
        qs = CreditNote.objects.select_related('parent_invoice', 'parent_invoice__customer', 'parent_invoice__company').prefetch_related('items').all()
        if not user.is_superuser and user.company:
            qs = qs.filter(parent_invoice__company=user.company)

        invoice_id = self.request.query_params.get('invoice')
        if invoice_id:
            qs = qs.filter(parent_invoice_id=invoice_id)

        return qs

    @action(detail=True, methods=['post'])
    def validate(self, request, pk=None):
        credit_note = self.get_object()

        if credit_note.status != InvoiceStatus.DRAFT:
            return Response({'detail': f"L'avoir est déjà au statut {credit_note.get_status_display()}."}, status=status.HTTP_400_BAD_REQUEST)

        if not credit_note.items.exists():
            return Response({'detail': "L'avoir doit contenir au moins une ligne."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            company = credit_note.parent_invoice.company
            billing_settings = BillingSettings.objects.filter(company=company, is_active=True).first()
            if not billing_settings:
                billing_settings = BillingSettings.objects.create(
                    company=company,
                    credit_note_prefix='AV-2026-',
                    next_credit_note_number=1
                )

            next_num = billing_settings.next_credit_note_number
            official_number = f"{billing_settings.credit_note_prefix}{next_num:04d}"
            billing_settings.next_credit_note_number += 1
            billing_settings.save(update_fields=['next_credit_note_number'])

            credit_note.number = official_number
            credit_note.status = InvoiceStatus.VALIDATED
            credit_note.recalculate_totals()
            credit_note.save()

            AuditLog.objects.create(
                user=request.user,
                action='VALIDATE_CREDIT_NOTE',
                entity_name='Avoir',
                entity_id=credit_note.id,
                ip_address=request.META.get('REMOTE_ADDR', ''),
                details={'credit_note_id': credit_note.id, 'number': credit_note.number, 'total_ttc': str(credit_note.total_ttc)}
            )

        return Response(CreditNoteSerializer(credit_note).data)

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        credit_note = self.get_object()
        pdf_bytes = generate_credit_note_pdf(credit_note)
        filename = f"avoir-{credit_note.number or 'brouillon'}.pdf"
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        return response
