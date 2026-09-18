from rest_framework.permissions import BasePermission
from apps.accounts.models import UserRole

class IsAdminRole(BasePermission):
    """Permission accordée uniquement aux utilisateurs avec le rôle ADMINISTRATEUR."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.role and request.user.role.nom == "ADMINISTRATEUR" or request.user.is_superuser))

class IsFacturierOrAdminRole(BasePermission):
    """Permission accordée aux utilisateurs avec le rôle FACTURIER ou ADMINISTRATEUR."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        role_nom = request.user.role.nom if request.user.role else ""
        return role_nom in ("ADMINISTRATEUR", "FACTURIER")

class IsReadOnlyRole(BasePermission):
    """Permission pour consultation uniquement (SAFE_METHODS)."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        if request.user.is_superuser:
            return True
        role_nom = request.user.role.nom if request.user.role else ""
        return role_nom in ("ADMINISTRATEUR", "FACTURIER")
