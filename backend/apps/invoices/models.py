from decimal import Decimal

from django.db import models
from django.utils import timezone


class InvoiceStatus(models.TextChoices):
    DRAFT = "BROUILLON", "Brouillon"
    VALIDATED = "VALIDEE", "Validée"
    TRANSMITTED = "ENVOYEE", "Envoyée"
    ACCEPTED = "ACCEPTEE", "Acceptée"
    REJECTED = "REJETEE", "Rejetée"
    ERROR = "ANNULEE", "Annulée"


class ETVAStatus(models.TextChoices):
    PENDING = "PENDING", "Non transmise"
    TRANSMITTED = "TRANSMITTED", "Transmise"
    ACCEPTED = "ACCEPTED", "Acceptée DGI"
    REJECTED = "REJECTED", "Rejetée DGI"
    ERROR = "ERROR", "Erreur technique"


class Invoice(models.Model):
    id = models.BigAutoField(primary_key=True)

    company = models.ForeignKey(
        "companies.Company",
        db_column="entreprise_id",
        on_delete=models.RESTRICT,
        related_name="invoices",
        verbose_name="Entreprise",
    )

    customer = models.ForeignKey(
        "customers.Customer",
        db_column="client_id",
        on_delete=models.RESTRICT,
        related_name="invoices",
        verbose_name="Client",
    )

    number = models.CharField(
        max_length=100,
        db_column="numero",
        verbose_name="Numéro de facture",
    )

    date = models.DateField(
        db_column="date_facture",
        default=timezone.localdate,
        verbose_name="Date de facturation",
    )

    total_ht = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("0.00"),
        verbose_name="Total HT",
    )

    total_tva = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("0.00"),
        verbose_name="Total TVA",
    )

    total_ttc = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("0.00"),
        verbose_name="Total TTC",
    )

    status = models.CharField(
        max_length=30,
        db_column="statut",
        choices=InvoiceStatus.choices,
        default=InvoiceStatus.DRAFT,
        verbose_name="Statut",
    )

    created_at = models.DateTimeField(
        default=timezone.now,
        verbose_name="Date de création",
    )

    class Meta:
        db_table = "facture"
        managed = False
        verbose_name = "Facture"
        verbose_name_plural = "Factures"
        ordering = ["-date", "-id"]
        constraints = []

    def __str__(self):
        return f"Facture {self.number} - {self.customer.name}"

    def recalculate_totals(self):
        """
        Recalcule les totaux à partir des lignes de facture.
        """
        total_ht = Decimal("0.00")
        total_tva = Decimal("0.00")

        for item in self.items.all():
            total_ht += item.line_total_ht
            total_tva += (
                item.line_total_ht
                * item.vat_rate
                / Decimal("100.00")
            )

        self.total_ht = total_ht
        self.total_tva = total_tva
        self.total_ttc = total_ht + total_tva

        self.save(
            update_fields=[
                "total_ht",
                "total_tva",
                "total_ttc",
            ]
        )


class InvoiceItem(models.Model):
    id = models.BigAutoField(primary_key=True)

    invoice = models.ForeignKey(
        Invoice,
        db_column="facture_id",
        on_delete=models.CASCADE,
        related_name="items",
        verbose_name="Facture",
    )

    product = models.ForeignKey(
        "products.Product",
        db_column="produit_id",
        on_delete=models.RESTRICT,
        related_name="invoice_items",
        verbose_name="Produit / Service",
    )

    designation = models.CharField(
        max_length=255,
        verbose_name="Désignation",
    )

    quantity = models.DecimalField(
        max_digits=15,
        decimal_places=3,
        db_column="quantite",
        verbose_name="Quantité",
    )

    unit_price = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        db_column="prix_unitaire",
        verbose_name="Prix unitaire HT",
    )

    vat_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        db_column="taux_tva",
        verbose_name="Taux TVA (%)",
    )

    line_total_ht = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        db_column="montant_ht",
        verbose_name="Montant HT",
    )

    class Meta:
        db_table = "ligne_facture"
        managed = False
        verbose_name = "Ligne de facture"
        verbose_name_plural = "Lignes de facture"
        ordering = ["id"]

    def __str__(self):
        return f"{self.designation} - {self.quantity}"

    @property
    def line_vat_amount(self):
        return (
            self.line_total_ht
            * self.vat_rate
            / Decimal("100.00")
        )

    @property
    def line_total_ttc(self):
        return self.line_total_ht + self.line_vat_amount
