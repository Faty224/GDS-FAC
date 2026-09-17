from django.contrib.auth.models import AbstractUser
from django.db import models

class UserRole(models.TextChoices):
    ADMIN = 'ADMIN', 'Administrateur'
    FACTURIER = 'FACTURIER', 'Facturier'
    CONSULTATION = 'CONSULTATION', 'Consultation'

class User(AbstractUser):
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.FACTURIER,
        help_text="Rôle définissant les autorisations dans l'application."
    )
    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users',
        help_text="Entreprise à laquelle appartient l'utilisateur pour l'isolation multi-tenant."
    )
    phone = models.CharField(max_length=50, blank=True, default='')
    job_title = models.CharField(max_length=100, blank=True, default='')

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.role})"
