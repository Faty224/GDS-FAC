from rest_framework import viewsets, permissions, filters
from apps.audit.models import AuditLog
from apps.audit.serializers import AuditLogSerializer
from apps.accounts.permissions import IsAdminRole

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['action', 'entity_name', 'user__username', 'ip_address']
    ordering_fields = ['id', 'created_at', 'action']

    def get_queryset(self):
        return AuditLog.objects.select_related('user').all()
