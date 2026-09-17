from rest_framework import serializers
from apps.audit.models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = AuditLog
        fields = (
            'id', 'user', 'username', 'action', 'entity_name',
            'entity_id', 'ip_address', 'user_agent', 'details', 'created_at'
        )
        read_only_fields = fields
