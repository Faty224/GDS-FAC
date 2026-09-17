from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "action",
        "entity_name",
        "entity_id",
        "ip_address",
        "created_at",
    )
    search_fields = (
        "action",
        "entity_name",
        "user__username",
        "user_agent",
    )
    list_filter = (
        "action",
        "entity_name",
        "created_at",
    )
    readonly_fields = (
        "user",
        "action",
        "entity_name",
        "entity_id",
        "details",
        "ip_address",
        "user_agent",
        "created_at",
    )
    ordering = ("-created_at",)
