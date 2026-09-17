from django.contrib import admin
from .models import Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "nifp",
        "company",
        "phone",
        "email",
        "status",
    )
    search_fields = (
        "name",
        "nifp",
        "email",
        "phone",
    )
    list_filter = (
        "status",
        "company",
    )
    ordering = ("name",)
