from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from apps.companies.models import Company
from apps.companies.serializers import CompanySerializer
from apps.accounts.permissions import IsAdminRole, IsReadOnlyRole

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticated, IsReadOnlyRole]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Company.objects.all()
        if user.company:
            return Company.objects.filter(id=user.company.id)
        return Company.objects.none()

@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def current_company_view(request):
    user = request.user
    company = user.company
    
    if not company:
        # Fallback to first company or create default for dev
        company = Company.objects.first()
        if not company:
            company = Company.objects.create(
                raison_sociale="GDS Solutions SARL",
                nif="NIF-100200300",
                address="Conakry, Guinée",
                phone="+224 620 00 00 00",
                email="contact@gds-solutions.gn"
            )
        user.company = company
        user.save()

    if request.method == 'GET':
        return Response(CompanySerializer(company).data)

    role_nom = getattr(user.role, 'nom', '') if user.role else ''
    if role_nom not in ['ADMIN', 'ADMINISTRATEUR'] and not user.is_superuser:
        return Response({'detail': "Action non autorisée. Rôle Administrateur requis."}, status=status.HTTP_403_FORBIDDEN)

    serializer = CompanySerializer(company, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)
