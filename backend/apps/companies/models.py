from django.db import models

class Company(models.Model):
    raison_sociale = models.CharField(max_length=255, verbose_name="Raison Sociale")
    nif = models.CharField(max_length=50, unique=True, verbose_name="Numéro d'Identification Fiscale (NIF)")
    rccm = models.CharField(max_length=100, blank=True, default='', verbose_name="RCCM")
    address = models.TextField(verbose_name="Adresse siège social")
    phone = models.CharField(max_length=50, verbose_name="Téléphone")
    email = models.EmailField(verbose_name="Email de contact")
    fiscal_regime = models.CharField(max_length=100, blank=True, default='Régime Réel', verbose_name="Régime Fiscal")
    tax_center = models.CharField(max_length=100, blank=True, default='', verbose_name="Centre des Impôts")
    logo_url = models.URLField(max_length=500, blank=True, default='')
    bank_name = models.CharField(max_length=100, blank=True, default='')
    bank_iban = models.CharField(max_length=100, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Entreprise"
        verbose_name_plural = "Entreprises"

    def __str__(self):
        return f"{self.raison_sociale} (NIF: {self.nif})"
