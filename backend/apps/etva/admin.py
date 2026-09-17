from django.contrib import admin
from .models import ETVATransmission


@admin.register(ETVATransmission)
class ETVATransmissionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "invoice",
        "method",
        "http_status",
        "request_id",
        "response_reference",
        "status",
        "created_at",
    )
    search_fields = (
        "invoice__number",
        "request_id",
        "response_reference",
        "endpoint",
        "error_code",
    )
    list_filter = (
        "status",
        "method",
        "http_status",
    )
    readonly_fields = (
        "created_at",
        "request_payload",
        "response_payload",
    )
    ordering = ("-created_at",)
