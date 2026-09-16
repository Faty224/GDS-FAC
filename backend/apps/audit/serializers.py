from rest_framework import serializers
from apps.audit.models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user_fullname = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = AuditLog
        fields = (
            'id', 'user', 'username', 'user_fullname', 'company', 'action',
            'target_object', 'ip_address', 'status', 'details', 'created_at'
        )
        read_only_fields = fields
