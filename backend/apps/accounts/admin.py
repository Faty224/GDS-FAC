from django.contrib import admin
from django.contrib.auth.models import Group

from .models import User, Role


# ============================================================
# RÔLES GDS FACTURE
# ============================================================

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "nom",
        "description",
        "created_at",
    )

    search_fields = (
        "nom",
        "description",
    )

    ordering = (
        "nom",
    )


# ============================================================
# UTILISATEURS GDS FACTURE
# ============================================================

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "username",
        "email",
        "role",
        "company",
        "is_active",
        "is_staff",
        "is_superuser",
        "created_at",
    )

    search_fields = (
        "username",
        "email",
    )

    list_filter = (
        "role",
        "is_active",
        "is_staff",
        "is_superuser",
    )

    ordering = (
        "username",
    )

    readonly_fields = (
        "created_at",
        "last_login",
        "date_joined",
    )


# ============================================================
# MASQUER LE SYSTÈME DJANGO GROUP
# ============================================================
#
# GDS Facture utilise son propre système :
#
#   Role
#      ├── ADMINISTRATEUR
#      ├── FACTURIER
#      └── CONSULTATION
#
# Nous n'utilisons donc pas django.contrib.auth Group.
#
try:
    admin.site.unregister(Group)
except admin.sites.NotRegistered:
    pass


# ============================================================
# MASQUER LE SYSTÈME DRF TOKEN
# ============================================================
#
# Le projet n'utilise pas actuellement authtoken_token.
# Nous utilisons notre système d'authentification GDS Facture.
#
try:
    from rest_framework.authtoken.models import TokenProxy

    admin.site.unregister(TokenProxy)

except ImportError:
    pass

except admin.sites.NotRegistered:
    pass