from rest_framework import serializers
from apps.credit_notes.models import CreditNote, CreditNoteItem, InvoiceStatus
from apps.customers.serializers import CustomerSerializer
from apps.invoices.serializers import InvoiceSerializer

class CreditNoteItemSerializer(serializers.ModelSerializer):
    line_vat_amount = serializers.ReadOnlyField()
    line_total_ttc = serializers.ReadOnlyField()

    class Meta:
        model = CreditNoteItem
        fields = (
            'id', 'product', 'designation', 'quantity', 'unit_price',
            'line_total_ht', 'line_vat_amount', 'line_total_ttc'
        )
        read_only_fields = ('id', 'line_total_ht', 'line_vat_amount', 'line_total_ttc')

class CreditNoteSerializer(serializers.ModelSerializer):
    items = CreditNoteItemSerializer(many=True, required=False)
    customer_detail = CustomerSerializer(source='parent_invoice.customer', read_only=True)
    parent_invoice_number = serializers.CharField(source='parent_invoice.number', read_only=True)
    company = serializers.PrimaryKeyRelatedField(source='parent_invoice.company', read_only=True)

    class Meta:
        model = CreditNote
        fields = (
            'id', 'company', 'number', 'parent_invoice', 'parent_invoice_number',
            'customer_detail', 'date', 'status', 'total_ht',
            'total_tva', 'total_ttc', 'created_at', 'items'
        )
        read_only_fields = (
            'id', 'company', 'number', 'status', 'total_ht',
            'total_tva', 'total_ttc', 'created_at'
        )

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        if not validated_data.get('number'):
            import uuid
            validated_data['number'] = f"AV-DRAFT-{uuid.uuid4().hex[:8].upper()}"

        credit_note = CreditNote.objects.create(**validated_data)

        for item_data in items_data:
            qty = item_data.get('quantity', 0)
            price = item_data.get('unit_price', 0)
            item_data['line_total_ht'] = qty * price
            CreditNoteItem.objects.create(credit_note=credit_note, **item_data)

        credit_note.recalculate_totals()
        return credit_note

    def update(self, instance, validated_data):
        if instance.status != InvoiceStatus.DRAFT:
            raise serializers.ValidationError("Seuls les avoirs au statut Brouillon peuvent être modifiés.")

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
                CreditNoteItem.objects.create(credit_note=instance, **item_data)

        instance.recalculate_totals()
        return instance
