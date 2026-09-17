from rest_framework import serializers
from apps.customers.models import Customer

class CustomerSerializer(serializers.ModelSerializer):
    is_active = serializers.SerializerMethodField()
    total_invoiced = serializers.SerializerMethodField()
    total_invoices_count = serializers.SerializerMethodField()
    last_invoice_date = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = (
            'id', 'company', 'name', 'nifp', 'email', 'phone',
            'address', 'status', 'is_active',
            'total_invoiced', 'total_invoices_count', 'last_invoice_date'
        )
        read_only_fields = ('id', 'company')

    def get_is_active(self, obj):
        return obj.status == 'ACTIF'

    def get_total_invoiced(self, obj):
        try:
            invoices = obj.invoices.exclude(status='BROUILLON')
            return float(sum((inv.total_ttc or 0) for inv in invoices))
        except Exception:
            return 0.0

    def get_total_invoices_count(self, obj):
        try:
            return obj.invoices.count()
        except Exception:
            return 0

    def get_last_invoice_date(self, obj):
        try:
            last_inv = obj.invoices.order_by('-date').first()
            return last_inv.date.strftime('%Y-%m-%d') if last_inv and last_inv.date else None
        except Exception:
            return None
