from django.db import models
from django.utils import timezone


class AuditLog(models.Model):
    id = models.BigAutoField(primary_key=True)

    user = models.ForeignKey(
        "accounts.User",
        db_column="user_id",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
        verbose_name="Utilisateur",
    )

    action = models.CharField(
        max_length=100,
        verbose_name="Action effectuée",
    )

    entity_name = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        verbose_name="Entité",
    )

    entity_id = models.BigIntegerField(
        null=True,
        blank=True,
        verbose_name="ID de l'entité",
    )

    details = models.JSONField(
        null=True,
        blank=True,
        verbose_name="Détails",
    )

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name="Adresse IP",
    )

    user_agent = models.TextField(
        null=True,
        blank=True,
        verbose_name="Navigateur / User-Agent",
    )

    created_at = models.DateTimeField(
        default=timezone.now,
        verbose_name="Date de création",
    )

    class Meta:
        db_table = "audit_log"
        managed = False
        verbose_name = "Journal d'audit"
        verbose_name_plural = "Journaux d'audit"
        ordering = ["-created_at"]

    def __str__(self):
        username = self.user.username if self.user else "Système"

        entity = self.entity_name or "Entité"

        if self.entity_id is not None:
            entity = f"{entity} #{self.entity_id}"

        return f"{username} - {self.action} - {entity}"
