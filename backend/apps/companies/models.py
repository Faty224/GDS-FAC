from django.db import models
from django.utils import timezone


class Company(models.Model):
    id = models.BigAutoField(primary_key=True)

    raison_sociale = models.CharField(
        max_length=150,
        db_column="nom",
        verbose_name="Nom / Raison sociale",
    )

    nif = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        verbose_name="NIF",
    )

    address = models.TextField(
        null=True,
        blank=True,
        db_column="adresse",
        verbose_name="Adresse",
    )

    phone = models.CharField(
        max_length=30,
        null=True,
        blank=True,
        db_column="telephone",
        verbose_name="Téléphone",
    )

    email = models.EmailField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name="Email",
    )

    logo_url = models.TextField(
        null=True,
        blank=True,
        db_column="logo",
        verbose_name="Logo",
    )

    created_at = models.DateTimeField(
        default=timezone.now,
        verbose_name="Date de création",
    )

    class Meta:
        db_table = "entreprise"
        managed = False
        verbose_name = "Entreprise"
        verbose_name_plural = "Entreprises"
        ordering = ["raison_sociale"]

    def __str__(self):
        return self.raison_sociale
