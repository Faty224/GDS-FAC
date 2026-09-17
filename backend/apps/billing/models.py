from django.db import models
from django.utils import timezone


class BillingSettings(models.Model):
    id = models.BigAutoField(primary_key=True)

    company = models.OneToOneField(
        "companies.Company",
        db_column="entreprise_id",
        on_delete=models.RESTRICT,
        related_name="billing_settings",
        verbose_name="Entreprise",
    )

    default_currency = models.CharField(
        max_length=10,
        db_column="devise",
        default="GNF",
        verbose_name="Devise",
    )

    default_vat_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        db_column="taux_tva_defaut",
        default=18.00,
        verbose_name="Taux TVA par défaut (%)",
    )

    payment_conditions = models.TextField(
        db_column="conditions_paiement",
        null=True,
        blank=True,
        verbose_name="Conditions de paiement",
    )

    prefix = models.CharField(
        max_length=20,
        db_column="prefixe_facture",
        default="FAC",
        verbose_name="Préfixe des factures",
    )

    created_at = models.DateTimeField(
        default=timezone.now,
        verbose_name="Date de création",
    )

    class Meta:
        db_table = "parametrage_facturation"
        managed = False
        verbose_name = "Paramétrage de facturation"
        verbose_name_plural = "Paramétrages de facturation"
        ordering = ["id"]

    def __str__(self):
        return f"{self.company} ({self.prefix})"
