from decimal import Decimal

from django.db import models
from django.utils import timezone

from apps.invoices.models import InvoiceStatus, ETVAStatus


class CreditNote(models.Model):
    id = models.BigAutoField(primary_key=True)

    parent_invoice = models.ForeignKey(
        "invoices.Invoice",
        db_column="facture_id",
        on_delete=models.RESTRICT,
        related_name="credit_notes",
        verbose_name="Facture d'origine",
    )

    number = models.CharField(
        max_length=100,
        db_column="numero",
        verbose_name="Numéro d'avoir",
    )

    date = models.DateField(
        db_column="date_avoir",
        default=timezone.now,
        verbose_name="Date d'émission",
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
        db_table = "avoir"
        managed = False
        verbose_name = "Avoir"
        verbose_name_plural = "Avoirs"
        ordering = ["-date", "-id"]

    def __str__(self):
        return (
            f"Avoir {self.number} "
            f"(Facture {self.parent_invoice.number}) "
            f"- {self.total_ttc} GNF TTC"
        )

    def recalculate_totals(self):
        total_ht = Decimal("0.00")
        total_tva = Decimal("0.00")

        for item in self.items.select_related("product").all():
            total_ht += item.line_total_ht

            vat_rate = item.product.vat_rate or Decimal("0.00")

            total_tva += (
                item.line_total_ht
                * vat_rate
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


class CreditNoteItem(models.Model):
    id = models.BigAutoField(primary_key=True)

    credit_note = models.ForeignKey(
        CreditNote,
        db_column="avoir_id",
        on_delete=models.CASCADE,
        related_name="items",
        verbose_name="Avoir",
    )

    product = models.ForeignKey(
        "products.Product",
        db_column="produit_id",
        on_delete=models.RESTRICT,
        related_name="credit_note_items",
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

    line_total_ht = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        db_column="montant_ht",
        verbose_name="Montant HT",
    )

    class Meta:
        db_table = "ligne_avoir"
        managed = False
        verbose_name = "Ligne d'avoir"
        verbose_name_plural = "Lignes d'avoir"
        ordering = ["id"]

    def __str__(self):
        return f"{self.designation} - {self.quantity}"

    @property
    def line_vat_amount(self):
        vat_rate = self.product.vat_rate or Decimal("0.00")
        return (
            self.line_total_ht
            * vat_rate
            / Decimal("100.00")
        )

    @property
    def line_total_ttc(self):
        return self.line_total_ht + self.line_vat_amount
