from django.contrib import admin
from .models import Invoice, InvoiceItem


class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 0
    fields = (
        "product",
        "designation",
        "quantity",
        "unit_price",
        "vat_rate",
        "line_total_ht",
    )


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "number",
        "company",
        "customer",
        "date",
        "total_ht",
        "total_tva",
        "total_ttc",
        "status",
    )
    search_fields = (
        "number",
        "customer__name",
        "company__raison_sociale",
    )
    list_filter = (
        "status",
        "date",
        "company",
    )
    readonly_fields = (
        "created_at",
        "total_ht",
        "total_tva",
        "total_ttc",
    )
    ordering = ("-date", "-id")
    inlines = [InvoiceItemInline]


@admin.register(InvoiceItem)
class InvoiceItemAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "invoice",
        "product",
        "designation",
        "quantity",
        "unit_price",
        "vat_rate",
        "line_total_ht",
    )
    search_fields = (
        "designation",
        "invoice__number",
        "product__reference",
    )
    list_filter = (
        "vat_rate",
    )
    ordering = ("-id",)
