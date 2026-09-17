from django.contrib import admin
from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "reference",
        "designation",
        "company",
        "category",
        "unit_price",
        "vat_rate",
        "status",
    )
    search_fields = (
        "reference",
        "designation",
    )
    list_filter = (
        "category",
        "status",
        "company",
    )
    ordering = ("reference",)
