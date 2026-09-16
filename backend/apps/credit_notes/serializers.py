from rest_framework import serializers
from apps.credit_notes.models import CreditNote, CreditNoteItem, InvoiceStatus
from apps.customers.serializers import CustomerSerializer
from apps.invoices.serializers import InvoiceSerializer

class CreditNoteItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditNoteItem
        fields = (
            'id', 'designation', 'description', 'quantity', 'unit_price',
            'vat_rate', 'line_total_ht', 'line_vat_amount', 'line_total_ttc'
        )
        read_only_fields = ('id', 'line_total_ht', 'line_vat_amount', 'line_total_ttc')

class CreditNoteSerializer(serializers.ModelSerializer):
    items = CreditNoteItemSerializer(many=True)
    customer_detail = CustomerSerializer(source='customer', read_only=True)
    parent_invoice_number = serializers.CharField(source='parent_invoice.number', read_only=True)

    class Meta:
        model = CreditNote
        fields = (
            'id', 'company', 'number', 'parent_invoice', 'parent_invoice_number', 'customer',
            'customer_detail', 'date', 'reason', 'status', 'etva_status', 'total_ht',
            'total_tva', 'total_ttc', 'created_by', 'validated_at', 'created_at', 'updated_at', 'items'
        )
        read_only_fields = (
            'id', 'company', 'number', 'status', 'etva_status', 'total_ht',
            'total_tva', 'total_ttc', 'created_by', 'validated_at', 'created_at', 'updated_at'
        )

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        request = self.context.get('request')
        user = request.user if request else None

        if user and user.company:
            validated_data['company'] = user.company
        if user:
            validated_data['created_by'] = user

        credit_note = CreditNote.objects.create(**validated_data)

        for item_data in items_data:
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
                CreditNoteItem.objects.create(credit_note=instance, **item_data)

        instance.recalculate_totals()
        return instance
