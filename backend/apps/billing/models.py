from django.db import models

class BillingSettings(models.Model):
    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.CASCADE,
        related_name='billing_settings',
        help_text="Entreprise associée au paramétrage."
    )
    title = models.CharField(max_length=100, default='Paramétrage standard', verbose_name="Libellé")
    prefix = models.CharField(max_length=20, default='FAC-2026-', verbose_name="Préfixe Factures")
    credit_note_prefix = models.CharField(max_length=20, default='AV-2026-', verbose_name="Préfixe Avoirs")
    next_number = models.PositiveIntegerField(default=1, verbose_name="Prochain numéro de facture")
    next_credit_note_number = models.PositiveIntegerField(default=1, verbose_name="Prochain numéro d'avoir")
    default_currency = models.CharField(max_length=10, default='GNF', verbose_name="Devise")
    default_vat_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18.00, verbose_name="Taux TVA par défaut (%)")
    legal_mentions = models.TextField(
        default="Facture établie conformément à la réglementation fiscale en vigueur.",
        verbose_name="Mentions légales"
    )
    payment_conditions = models.TextField(
        default="Paiement à 30 jours à compter de la date d'émission.",
        verbose_name="Conditions de paiement"
    )
    payment_instructions = models.TextField(
        default="Virement bancaire au compte inscrit sur la facture.",
        verbose_name="Instructions de paiement"
    )
    is_active = models.BooleanField(default=True, verbose_name="Actif")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Paramétrage de facturation"
        verbose_name_plural = "Paramétrages de facturation"

    def __str__(self):
        return f"{self.title} ({self.prefix})"
