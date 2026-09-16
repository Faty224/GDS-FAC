from django.db import models

class ProductType(models.TextChoices):
    PRODUIT = 'PRODUIT', 'Produit'
    SERVICE = 'SERVICE', 'Service'

class Product(models.Model):
    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.CASCADE,
        related_name='products',
        help_text="Entreprise propriétaire du produit/service."
    )
    reference = models.CharField(max_length=50, verbose_name="Référence")
    designation = models.CharField(max_length=255, verbose_name="Désignation")
    description = models.TextField(blank=True, default='', verbose_name="Description")
    category = models.CharField(
        max_length=20,
        choices=ProductType.choices,
        default=ProductType.SERVICE,
        verbose_name="Type / Catégorie"
    )
    unit_price = models.DecimalField(max_digits=15, decimal_places=2, verbose_name="Prix unitaire HT")
    vat_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18.00, verbose_name="Taux TVA (%)")
    unit = models.CharField(max_length=20, default='UNITE', verbose_name="Unité de mesure")
    is_active = models.BooleanField(default=True, verbose_name="Actif")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Produit / Service"
        verbose_name_plural = "Produits & Services"
        unique_together = ('company', 'reference')
        ordering = ['reference', 'designation']

    def __str__(self):
        return f"[{self.reference}] {self.designation} ({self.unit_price} GNF HT)"
