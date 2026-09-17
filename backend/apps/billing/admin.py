from django.contrib import admin
from .models import BillingSettings


@admin.register(BillingSettings)
class BillingSettingsAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "company",
        "default_currency",
        "default_vat_rate",
        "prefix",
        "created_at",
    )
    search_fields = (
        "company__raison_sociale",
        "prefix",
    )
    list_filter = (
        "default_currency",
    )
    readonly_fields = ("created_at",)
    ordering = ("company",)
