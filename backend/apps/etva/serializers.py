from rest_framework import serializers
from apps.etva.models import ETVATransmission

class ETVATransmissionSerializer(serializers.ModelSerializer):
    invoice_number = serializers.CharField(source='invoice.number', read_only=True)
    credit_note_number = serializers.CharField(source='credit_note.number', read_only=True)

    class Meta:
        model = ETVATransmission
        fields = (
            'id', 'company', 'invoice', 'invoice_number', 'credit_note', 'credit_note_number',
            'environment', 'status', 'external_reference', 'http_status', 'response_message',
            'response_payload', 'duration_ms', 'transmitted_by', 'transmitted_at'
        )
        read_only_fields = ('id', 'company', 'transmitted_at')
