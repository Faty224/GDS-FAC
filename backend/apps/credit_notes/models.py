from django.db import models
from decimal import Decimal
from django.utils import timezone
from apps.invoices.models import InvoiceStatus, ETVAStatus

class CreditNote(models.Model):
    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.CASCADE,
        related_name='credit_notes',
        verbose_name="Entreprise"
    )
    number = models.CharField(max_length=100, blank=True, default='BROUILLON', verbose_name="Numéro d'avoir")
    parent_invoice = models.ForeignKey(
        'invoices.Invoice',
        on_delete=models.PROTECT,
        related_name='credit_notes',
        verbose_name="Facture d'origine"
    )
    customer = models.ForeignKey(
        'customers.Customer',
        on_delete=models.PROTECT,
        related_name='credit_notes',
        verbose_name="Client"
    )
    date = models.DateField(default=timezone.now, verbose_name="Date d'émission")
    reason = models.TextField(verbose_name="Motif d'émission de l'avoir")
    status = models.CharField(
        max_length=20,
        choices=InvoiceStatus.choices,
        default=InvoiceStatus.DRAFT,
        verbose_name="Statut Avoir"
    )
    etva_status = models.CharField(
        max_length=20,
        choices=ETVAStatus.choices,
        default=ETVAStatus.PENDING,
        verbose_name="Statut eTVA"
    )
    total_ht = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'), verbose_name="Total HT")
    total_tva = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'), verbose_name="Total TVA")
    total_ttc = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'), verbose_name="Total TTC")
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_credit_notes',
        verbose_name="Créateur"
    )
    validated_at = models.DateTimeField(null=True, blank=True, verbose_name="Date de validation")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Avoir"
        verbose_name_plural = "Avoirs"
        ordering = ['-created_at']

    def __str__(self):
        return f"Avoir {self.number} (Facture {self.parent_invoice.number}) - {self.total_ttc} GNF TTC"

    def recalculate_totals(self):
        items = self.items.all()
        total_ht = Decimal('0.00')
        total_tva = Decimal('0.00')
        total_ttc = Decimal('0.00')

        for item in items:
            total_ht += item.line_total_ht
            total_tva += item.line_vat_amount
            total_ttc += item.line_total_ttc

        self.total_ht = total_ht
        self.total_tva = total_tva
        self.total_ttc = total_ttc
        self.save(update_fields=['total_ht', 'total_tva', 'total_ttc'])


class CreditNoteItem(models.Model):
    credit_note = models.ForeignKey(
        CreditNote,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name="Avoir"
    )
    designation = models.CharField(max_length=255, verbose_name="Désignation")
    description = models.TextField(blank=True, default='', verbose_name="Description")
    quantity = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('1.00'), verbose_name="Quantité")
    unit_price = models.DecimalField(max_digits=15, decimal_places=2, verbose_name="Prix unitaire HT")
    vat_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('18.00'), verbose_name="Taux TVA (%)")
    line_total_ht = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'), verbose_name="Total Ligne HT")
    line_vat_amount = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'), verbose_name="Montant TVA Ligne")
    line_total_ttc = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'), verbose_name="Total Ligne TTC")

    class Meta:
        verbose_name = "Ligne d'avoir"
        verbose_name_plural = "Lignes d'avoir"

    def save(self, *args, **kwargs):
        self.line_total_ht = round(Decimal(str(self.quantity)) * Decimal(str(self.unit_price)), 2)
        self.line_vat_amount = round(self.line_total_ht * (Decimal(str(self.vat_rate)) / Decimal('100.00')), 2)
        self.line_total_ttc = self.line_total_ht + self.line_vat_amount
        super().save(*args, **kwargs)
        if self.credit_note_id:
            self.credit_note.recalculate_totals()

    def delete(self, *args, **kwargs):
        cn = self.credit_note
        super().delete(*args, **kwargs)
        if cn:
            cn.recalculate_totals()
