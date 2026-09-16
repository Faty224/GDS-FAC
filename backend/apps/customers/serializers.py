from rest_framework import serializers
from apps.customers.models import Customer

class CustomerSerializer(serializers.ModelSerializer):
    total_invoiced = serializers.SerializerMethodField()
    total_invoices_count = serializers.SerializerMethodField()
    last_invoice_date = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = (
            'id', 'company', 'name', 'nifp', 'rccm', 'email', 'phone',
            'address', 'city', 'country', 'is_active', 'is_archived',
            'created_at', 'updated_at', 'total_invoiced', 'total_invoices_count', 'last_invoice_date'
        )
        read_only_fields = ('id', 'company', 'created_at', 'updated_at')

    def get_total_invoiced(self, obj):
        invoices = getattr(obj, 'invoices', None)
        if invoices:
            valid_invoices = invoices.exclude(status='DRAFT')
            return sum(inv.total_ttc for inv in valid_invoices)
        return 0.0

    def get_total_invoices_count(self, obj):
        invoices = getattr(obj, 'invoices', None)
        if invoices:
            return invoices.count()
        return 0

    def get_last_invoice_date(self, obj):
        invoices = getattr(obj, 'invoices', None)
        if invoices and invoices.exists():
            last_inv = invoices.order_by('-date').first()
            return last_inv.date.strftime('%Y-%m-%d') if last_inv and last_inv.date else None
        return None
