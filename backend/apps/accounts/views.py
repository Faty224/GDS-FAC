from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import login, logout

from apps.accounts.models import User
from apps.accounts.serializers import (
    UserSerializer, UserCreateSerializer, LoginSerializer, ChangePasswordSerializer
)
from apps.accounts.permissions import IsAdminRole

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-id')
    permission_classes = [IsAdminRole]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return User.objects.all().order_by('-id')
        if user.company:
            return User.objects.filter(company=user.company).order_by('-id')
        return User.objects.filter(id=user.id)

    def perform_create(self, serializer):
        company = getattr(self.request.user, 'company', None)
        serializer.save(company=company)

    @action(detail=True, methods=['patch', 'post'])
    def activate(self, request, pk=None):
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        return Response(UserSerializer(user).data)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data['user']
    login(request, user)

    from rest_framework.authtoken.models import Token
    token, _ = Token.objects.get_or_create(user=user)
    user_data = UserSerializer(user).data

    return Response({
        'token': token.key,
        'user': user_data,
        'message': 'Connexion réussie.'
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response({'message': 'Déconnexion réussie.'})

@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    user = request.user
    if request.method == 'GET':
        return Response(UserSerializer(user).data)
    
    serializer = UserSerializer(user, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    request.user.set_password(serializer.validated_data['new_password'])
    request.user.save()
    return Response({'message': 'Mot de passe modifié avec succès.'})
