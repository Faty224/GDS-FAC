from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.customers.models import Customer
from apps.customers.serializers import CustomerSerializer
from apps.accounts.permissions import IsFacturierOrAdminRole, IsReadOnlyRole

class CustomerViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated, IsReadOnlyRole]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'nifp', 'email', 'phone', 'city']
    ordering_fields = ['id', 'name', 'created_at']

    def get_queryset(self):
        user = self.request.user
        qs = Customer.objects.all()
        if not user.is_superuser and user.company:
            qs = qs.filter(company=user.company)

        # Handle active/archived query params
        include_archived = self.request.query_params.get('include_archived', 'false').lower() == 'true'
        if not include_archived:
            qs = qs.filter(is_archived=False)

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        company = user.company
        serializer.save(company=company)

    @action(detail=True, methods=['post'])
    def toggle_archive(self, request, pk=None):
        customer = self.get_object()
        customer.is_archived = not customer.is_archived
        customer.save()
        return Response({
            'id': customer.id,
            'is_archived': customer.is_archived,
            'message': 'Statut d\'archivage mis à jour.'
        })
