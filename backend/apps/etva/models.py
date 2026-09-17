from django.db import models
from django.utils import timezone


class ETVATransmissionStatus(models.TextChoices):
    SUCCESS = "SUCCESS", "Transmise / Validée"
    REJECTED = "REJECTED", "Rejetée"
    ERROR = "ERROR", "Erreur technique"
    PENDING = "PENDING", "En cours"


class ETVATransmission(models.Model):
    id = models.BigAutoField(primary_key=True)

    invoice = models.ForeignKey(
        "invoices.Invoice",
        db_column="facture_id",
        on_delete=models.RESTRICT,
        related_name="etva_transactions",
        verbose_name="Facture",
    )

    endpoint = models.CharField(
        max_length=500,
        verbose_name="Endpoint API",
    )

    method = models.CharField(
        max_length=10,
        verbose_name="Méthode HTTP",
    )

    http_status = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="Code HTTP",
    )

    request_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name="Request ID",
    )

    response_reference = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name="Référence réponse",
    )

    status = models.CharField(
        max_length=30,
        choices=ETVATransmissionStatus.choices,
        verbose_name="Statut",
    )

    error_code = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        verbose_name="Code erreur",
    )

    request_payload = models.JSONField(
        null=True,
        blank=True,
        verbose_name="Requête JSON",
    )

    response_payload = models.JSONField(
        null=True,
        blank=True,
        verbose_name="Réponse JSON",
    )

    created_at = models.DateTimeField(
        default=timezone.now,
        verbose_name="Date de création",
    )

    class Meta:
        db_table = "api_transaction"
        managed = False
        verbose_name = "Transaction API eTVA"
        verbose_name_plural = "Transactions API eTVA"
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"{self.method} {self.endpoint} - "
            f"{self.status}"
        )
