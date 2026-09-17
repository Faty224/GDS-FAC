from django.contrib import admin
from .models import Company


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "raison_sociale",
        "nif",
        "phone",
        "email",
        "created_at",
    )
    search_fields = (
        "raison_sociale",
        "nif",
        "email",
    )
    ordering = ("raison_sociale",)
    readonly_fields = ("created_at",)
