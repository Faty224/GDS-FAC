from rest_framework import serializers
from apps.invoices.models import Invoice, InvoiceItem, InvoiceStatus, ETVAStatus
from apps.customers.serializers import CustomerSerializer
from apps.billing.serializers import BillingSettingsSerializer

class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = (
            'id', 'product', 'designation', 'quantity',
            'unit_price', 'vat_rate', 'line_total_ht', 'line_vat_amount', 'line_total_ttc'
        )
        read_only_fields = ('id', 'line_total_ht', 'line_vat_amount', 'line_total_ttc')

class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, required=False)
    customer_detail = CustomerSerializer(source='customer', read_only=True)
    due_date = serializers.SerializerMethodField()
    etva_status = serializers.SerializerMethodField()
    document_type = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = (
            'id', 'company', 'number', 'customer', 'customer_detail',
            'date', 'due_date', 'status', 'etva_status', 'document_type',
            'total_ht', 'total_tva', 'total_ttc',
            'created_at', 'items'
        )
        read_only_fields = (
            'id', 'company', 'number', 'status', 'total_ht', 'total_tva',
            'total_ttc', 'created_at'
        )

    def get_due_date(self, obj):
        return obj.date.strftime('%Y-%m-%d') if obj.date else None

    def get_etva_status(self, obj):
        return "non_transmis"

    def get_document_type(self, obj):
        return "facture"

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        request = self.context.get('request')
        user = request.user if request else None

        if user and hasattr(user, 'company') and user.company:
            validated_data['company'] = user.company

        if not validated_data.get('number'):
            import uuid
            validated_data['number'] = f"DRAFT-{uuid.uuid4().hex[:8].upper()}"

        invoice = Invoice.objects.create(**validated_data)

        for item_data in items_data:
            qty = item_data.get('quantity', 0)
            price = item_data.get('unit_price', 0)
            item_data['line_total_ht'] = qty * price
            InvoiceItem.objects.create(invoice=invoice, **item_data)

        invoice.recalculate_totals()
        return invoice

    def update(self, instance, validated_data):
        if instance.status != InvoiceStatus.DRAFT:
            raise serializers.ValidationError("Seules les factures au statut Brouillon peuvent être modifiées.")

        items_data = validated_data.pop('items', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                qty = item_data.get('quantity', 0)
                price = item_data.get('unit_price', 0)
                item_data['line_total_ht'] = qty * price
                InvoiceItem.objects.create(invoice=instance, **item_data)

        instance.recalculate_totals()
        return instance
