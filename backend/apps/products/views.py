from rest_framework import viewsets, permissions, filters
from apps.products.models import Product
from apps.products.serializers import ProductSerializer
from apps.accounts.permissions import IsReadOnlyRole

class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated, IsReadOnlyRole]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['reference', 'designation', 'description', 'category']
    ordering_fields = ['reference', 'designation', 'unit_price', 'created_at']

    def get_queryset(self):
        user = self.request.user
        qs = Product.objects.all()
        if not user.is_superuser and user.company:
            qs = qs.filter(company=user.company)
        
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category.upper())
            
        active_only = self.request.query_params.get('active_only', 'false').lower() == 'true'
        if active_only:
            qs = qs.filter(is_active=True)

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(company=user.company)
