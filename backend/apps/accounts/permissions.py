from rest_framework.permissions import BasePermission
from apps.accounts.models import UserRole

class IsAdminRole(BasePermission):
    """Permission accordée uniquement aux utilisateurs avec le rôle ADMIN."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.role == UserRole.ADMIN or request.user.is_superuser))

class IsFacturierOrAdminRole(BasePermission):
    """Permission accordée aux utilisateurs avec le rôle FACTURIER ou ADMIN."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in (UserRole.ADMIN, UserRole.FACTURIER) or (request.user and request.user.is_superuser))

class IsReadOnlyRole(BasePermission):
    """Permission pour consultation uniquement (SAFE_METHODS)."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return request.user.role in (UserRole.ADMIN, UserRole.FACTURIER) or request.user.is_superuser
