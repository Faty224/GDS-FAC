from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractBaseUser
from django.db import models
from django.utils import timezone


class UserRole(models.TextChoices):
    ADMINISTRATEUR = "ADMINISTRATEUR", "Administrateur"
    FACTURIER = "FACTURIER", "Facturier"
    CONSULTATION = "CONSULTATION", "Consultation"


class Role(models.Model):
    id = models.BigAutoField(primary_key=True)
    nom = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "role"
        managed = False
        verbose_name = "Rôle"
        verbose_name_plural = "Rôles"

    def __str__(self):
        return self.nom


class UserManager(BaseUserManager):

    def create_user(self, username, email=None, password=None, **extra_fields):
        if not username:
            raise ValueError("Le nom d'utilisateur est obligatoire.")

        email = self.normalize_email(email) if email else None

        user = self.model(
            username=username,
            email=email,
            **extra_fields,
        )

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save(using=self._db)
        return user

    def create_superuser(self, username, email=None, password=None, **extra_fields):
        if not password:
            raise ValueError(
                "Le mot de passe du superutilisateur est obligatoire."
            )

        role = Role.objects.get(nom="ADMINISTRATEUR")

        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields["role"] = role

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Un superutilisateur doit avoir is_staff=True.")

        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Un superutilisateur doit avoir is_superuser=True.")

        return self.create_user(
            username=username,
            email=email,
            password=password,
            **extra_fields,
        )


class User(AbstractBaseUser):

    id = models.BigAutoField(primary_key=True)

    username = models.CharField(
        max_length=150,
        unique=True,
    )

    email = models.EmailField(
        max_length=255,
        unique=True,
        null=True,
        blank=True,
    )

    password = models.CharField(
        max_length=255,
        db_column="password_hash",
    )

    role = models.ForeignKey(
        Role,
        db_column="role_id",
        on_delete=models.RESTRICT,
        related_name="users",
    )

    company = models.ForeignKey(
        "companies.Company",
        db_column="entreprise_id",
        on_delete=models.RESTRICT,
        null=True,
        blank=True,
        related_name="users",
    )

    is_active = models.BooleanField(
        default=True,
    )

    is_staff = models.BooleanField(
        default=False,
    )

    is_superuser = models.BooleanField(
        default=False,
    )

    last_login = models.DateTimeField(
        null=True,
        blank=True,
    )

    date_joined = models.DateTimeField(
        default=timezone.now,
    )

    created_at = models.DateTimeField(
        default=timezone.now,
        editable=False,
    )

    phone = models.CharField(
        max_length=50,
        blank=True,
        default="",
    )

    job_title = models.CharField(
        max_length=100,
        blank=True,
        default="",
    )

    objects = UserManager()

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["email"]

    class Meta:
        db_table = "users"
        managed = False
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"

    def __str__(self):
        return f"{self.username} ({self.role})"

    def has_perm(self, perm, obj=None):
        if not self.is_active:
            return False

        return self.is_superuser

    def has_module_perms(self, app_label):
        return self.is_active and self.is_staff