from rest_framework import serializers
from apps.invoices.models import Invoice, InvoiceItem, InvoiceStatus, ETVAStatus
from apps.customers.serializers import CustomerSerializer
from apps.billing.serializers import BillingSettingsSerializer

class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = (
            'id', 'product', 'designation', 'description', 'quantity',
            'unit_price', 'vat_rate', 'line_total_ht', 'line_vat_amount', 'line_total_ttc'
        )
        read_only_fields = ('id', 'line_total_ht', 'line_vat_amount', 'line_total_ttc')

class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True)
    customer_detail = CustomerSerializer(source='customer', read_only=True)

    class Meta:
        model = Invoice
        fields = (
            'id', 'company', 'number', 'customer', 'customer_detail', 'billing_settings',
            'date', 'due_date', 'status', 'etva_status', 'total_ht', 'total_tva', 'total_ttc',
            'legal_mentions', 'payment_conditions', 'payment_instructions', 'notes',
            'created_by', 'validated_at', 'created_at', 'updated_at', 'items'
        )
        read_only_fields = (
            'id', 'company', 'number', 'status', 'etva_status', 'total_ht', 'total_tva',
            'total_ttc', 'created_by', 'validated_at', 'created_at', 'updated_at'
        )

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        request = self.context.get('request')
        user = request.user if request else None

        if user and user.company:
            validated_data['company'] = user.company
        if user:
            validated_data['created_by'] = user

        invoice = Invoice.objects.create(**validated_data)

        for item_data in items_data:
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
                InvoiceItem.objects.create(invoice=instance, **item_data)

        instance.recalculate_totals()
        return instance
