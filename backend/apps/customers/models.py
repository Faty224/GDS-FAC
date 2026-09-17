from django.db import models


class Customer(models.Model):
    id = models.BigAutoField(primary_key=True)

    company = models.ForeignKey(
        "companies.Company",
        db_column="entreprise_id",
        on_delete=models.RESTRICT,
        related_name="customers",
        verbose_name="Entreprise",
    )

    name = models.CharField(
        max_length=150,
        db_column="nom",
        verbose_name="Nom / Raison sociale",
    )

    nifp = models.CharField(
        max_length=50,
        db_column="nif",
        null=True,
        blank=True,
        verbose_name="NIF / NIFp Client",
    )

    address = models.TextField(
        db_column="adresse",
        null=True,
        blank=True,
        verbose_name="Adresse",
    )

    phone = models.CharField(
        max_length=30,
        db_column="telephone",
        null=True,
        blank=True,
        verbose_name="Téléphone",
    )

    email = models.EmailField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name="Email",
    )

    status = models.CharField(
        max_length=20,
        default="ACTIF",
        verbose_name="Statut",
    )

    class Meta:
        db_table = "client"
        managed = False
        verbose_name = "Client"
        verbose_name_plural = "Clients"
        ordering = ["-id"]

    def __str__(self):
        nif_str = f" (NIF: {self.nifp})" if self.nifp else ""
        return f"{self.name}{nif_str}"
