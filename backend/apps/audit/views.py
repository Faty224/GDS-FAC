from rest_framework import viewsets, permissions, filters
from apps.audit.models import AuditLog
from apps.audit.serializers import AuditLogSerializer
from apps.accounts.permissions import IsAdminRole

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['action', 'target_object', 'user__username', 'ip_address']
    ordering_fields = ['id', 'created_at', 'action']

    def get_queryset(self):
        user = self.request.user
        qs = AuditLog.objects.select_related('user', 'company').all()
        if not user.is_superuser and user.company:
            qs = qs.filter(company=user.company)
        return qs
