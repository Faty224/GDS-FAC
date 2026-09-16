from rest_framework import serializers
from apps.billing.models import BillingSettings

class BillingSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillingSettings
        fields = '__all__'
        read_only_fields = ('id', 'company', 'created_at', 'updated_at')
