from django.db import models

class ETVAEnvironment(models.TextChoices):
    SANDBOX = 'SANDBOX', 'Sandbox / Démo'
    HOMOLOGATION = 'HOMOLOGATION', 'Homologation DGI'
    PRODUCTION = 'PRODUCTION', 'Production'

class ETVATransmissionStatus(models.TextChoices):
    SUCCESS = 'SUCCESS', 'Transmis & Validé DGI'
    REJECTED = 'REJECTED', 'Rejeté par la DGI'
    ERROR = 'ERROR', 'Erreur Technique'
    PENDING = 'PENDING', 'En cours de traitement'

class ETVATransmission(models.Model):
    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.CASCADE,
        related_name='etva_transmissions',
        verbose_name="Entreprise"
    )
    invoice = models.ForeignKey(
        'invoices.Invoice',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='etva_transmissions',
        verbose_name="Facture"
    )
    credit_note = models.ForeignKey(
        'credit_notes.CreditNote',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='etva_transmissions',
        verbose_name="Avoir"
    )
    environment = models.CharField(
        max_length=20,
        choices=ETVAEnvironment.choices,
        default=ETVAEnvironment.SANDBOX,
        verbose_name="Environnement"
    )
    status = models.CharField(
        max_length=20,
        choices=ETVATransmissionStatus.choices,
        default=ETVATransmissionStatus.PENDING,
        verbose_name="Statut Transmission"
    )
    external_reference = models.CharField(max_length=100, blank=True, default='', verbose_name="Référence DGI / Signin")
    http_status = models.IntegerField(null=True, blank=True, verbose_name="Code HTTP")
    response_message = models.TextField(blank=True, default='', verbose_name="Message API")
    response_payload = models.TextField(blank=True, default='', verbose_name="Données Réponse API (Masquées)")
    duration_ms = models.IntegerField(default=0, verbose_name="Durée de la requête (ms)")
    transmitted_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Transmis par"
    )
    transmitted_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de transmission")

    class Meta:
        verbose_name = "Journal Transmission eTVA"
        verbose_name_plural = "Journaux Transmissions eTVA"
        ordering = ['-transmitted_at']

    def __str__(self):
        doc_str = f"Facture {self.invoice.number}" if self.invoice else f"Avoir {self.credit_note.number}" if self.credit_note else "Document"
        return f"eTVA [{self.environment}] {doc_str} -> {self.status}"
