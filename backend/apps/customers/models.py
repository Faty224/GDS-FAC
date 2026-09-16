from django.db import models

class Customer(models.Model):
    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.CASCADE,
        related_name='customers',
        help_text="Entreprise associée au client."
    )
    name = models.CharField(max_length=255, verbose_name="Nom / Raison Sociale")
    nifp = models.CharField(max_length=50, blank=True, default='', verbose_name="NIF / NIFp Client")
    rccm = models.CharField(max_length=100, blank=True, default='', verbose_name="RCCM Client")
    email = models.EmailField(blank=True, default='', verbose_name="Email")
    phone = models.CharField(max_length=50, blank=True, default='', verbose_name="Téléphone")
    address = models.TextField(blank=True, default='', verbose_name="Adresse")
    city = models.CharField(max_length=100, blank=True, default='Conakry', verbose_name="Ville")
    country = models.CharField(max_length=100, blank=True, default='Guinée', verbose_name="Pays")
    is_active = models.BooleanField(default=True, verbose_name="Actif")
    is_archived = models.BooleanField(default=False, verbose_name="Archivé")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Client"
        verbose_name_plural = "Clients"
        ordering = ['-id']

    def __str__(self):
        nif_str = f" (NIF: {self.nifp})" if self.nifp else ""
        return f"{self.name}{nif_str}"
