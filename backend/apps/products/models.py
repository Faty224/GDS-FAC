from django.db import models


class ProductType(models.TextChoices):
    PRODUIT = "PRODUIT", "Produit"
    SERVICE = "SERVICE", "Service"


class ProductStatus(models.TextChoices):
    ACTIF = "ACTIF", "Actif"
    INACTIF = "INACTIF", "Inactif"


class Product(models.Model):
    id = models.BigAutoField(primary_key=True)

    company = models.ForeignKey(
        "companies.Company",
        db_column="entreprise_id",
        on_delete=models.RESTRICT,
        related_name="products",
        verbose_name="Entreprise",
    )

    reference = models.CharField(
        max_length=100,
        verbose_name="Référence",
    )

    designation = models.CharField(
        max_length=255,
        verbose_name="Désignation",
    )

    category = models.CharField(
        max_length=30,
        db_column="type",
        choices=ProductType.choices,
        default=ProductType.PRODUIT,
        verbose_name="Type",
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
        default=18.00,
        verbose_name="Taux TVA (%)",
    )

    status = models.CharField(
        max_length=20,
        default="ACTIF",
        choices=ProductStatus.choices,
        verbose_name="Statut",
    )

    class Meta:
        db_table = "produit"
        managed = False
        verbose_name = "Produit / Service"
        verbose_name_plural = "Produits & Services"
        constraints = []
        ordering = ["reference", "designation"]

    def __str__(self):
        return f"[{self.reference}] {self.designation}"
