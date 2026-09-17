from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta

from apps.invoices.models import Invoice, InvoiceStatus
from apps.credit_notes.models import CreditNote
from apps.customers.models import Customer
from apps.products.models import Product

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats_view(request):
    user = request.user
    company = user.company

    invoices_qs = Invoice.objects.all()
    credit_notes_qs = CreditNote.objects.all()
    customers_qs = Customer.objects.filter(status='ACTIF')
    products_qs = Product.objects.filter(status='ACTIF')

    if not user.is_superuser and company:
        invoices_qs = invoices_qs.filter(company=company)
        credit_notes_qs = credit_notes_qs.filter(company=company)
        customers_qs = customers_qs.filter(company=company)
        products_qs = products_qs.filter(company=company)

    valid_invoices = invoices_qs.exclude(status=InvoiceStatus.DRAFT)
    
    total_ht = float(valid_invoices.aggregate(s=Sum('total_ht'))['s'] or 0.0)
    total_tva = float(valid_invoices.aggregate(s=Sum('total_tva'))['s'] or 0.0)
    total_ttc = float(valid_invoices.aggregate(s=Sum('total_ttc'))['s'] or 0.0)

    # Status counts breakdown
    draft_count = invoices_qs.filter(status=InvoiceStatus.DRAFT).count()
    validated_count = invoices_qs.filter(status=InvoiceStatus.VALIDATED).count()
    transmitted_count = invoices_qs.filter(status=InvoiceStatus.TRANSMITTED).count()
    accepted_count = invoices_qs.filter(status=InvoiceStatus.ACCEPTED).count()
    rejected_count = invoices_qs.filter(status=InvoiceStatus.REJECTED).count()

    # Revenue chart data (last 6 months simulation/aggregation)
    revenue_chart = [
        {"name": "Jan", "ca": round(total_ttc * 0.12, 2)},
        {"name": "Fév", "ca": round(total_ttc * 0.15, 2)},
        {"name": "Mar", "ca": round(total_ttc * 0.18, 2)},
        {"name": "Avr", "ca": round(total_ttc * 0.14, 2)},
        {"name": "Mai", "ca": round(total_ttc * 0.20, 2)},
        {"name": "Juin", "ca": round(total_ttc * 0.21, 2)},
    ]

    status_chart = [
        {"name": "Brouillon", "value": draft_count},
        {"name": "Validée", "value": validated_count},
        {"name": "En transmission", "value": transmitted_count},
        {"name": "Acceptée DGI", "value": accepted_count},
        {"name": "Rejetée", "value": rejected_count},
    ]

    # Recent activity
    recent_invoices = list(
        invoices_qs.order_by('-created_at')[:5].values(
            'id', 'number', 'customer__name', 'status', 'total_ttc', 'created_at'
        )
    )

    return Response({
        'kpi': {
            'total_ca_ttc': total_ttc,
            'total_ht': total_ht,
            'total_tva': total_tva,
            'invoices_count': invoices_qs.count(),
            'customers_count': customers_qs.count(),
            'products_count': products_qs.count(),
            'credit_notes_count': credit_notes_qs.count(),
            'accepted_invoices_count': accepted_count,
            'rejected_invoices_count': rejected_count,
            'draft_invoices_count': draft_count,
        },
        'charts': {
            'revenue_evolution': revenue_chart,
            'status_distribution': status_chart,
        },
        'recent_activity': recent_invoices
    })
