from django.contrib import admin
from .models import CreditNote, CreditNoteItem


class CreditNoteItemInline(admin.TabularInline):
    model = CreditNoteItem
    extra = 0
    fields = (
        "product",
        "designation",
        "quantity",
        "unit_price",
        "line_total_ht",
    )


@admin.register(CreditNote)
class CreditNoteAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "number",
        "parent_invoice",
        "date",
        "total_ht",
        "total_tva",
        "total_ttc",
        "status",
    )
    search_fields = (
        "number",
        "parent_invoice__number",
    )
    list_filter = (
        "status",
        "date",
    )
    readonly_fields = (
        "created_at",
        "total_ht",
        "total_tva",
        "total_ttc",
    )
    ordering = ("-date", "-id")
    inlines = [CreditNoteItemInline]


@admin.register(CreditNoteItem)
class CreditNoteItemAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "credit_note",
        "product",
        "designation",
        "quantity",
        "unit_price",
        "line_total_ht",
    )
    search_fields = (
        "designation",
        "credit_note__number",
        "product__reference",
    )
    ordering = ("-id",)
