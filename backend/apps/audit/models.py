from django.db import models

class AuditLog(models.Model):
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        verbose_name="Utilisateur"
    )
    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        verbose_name="Entreprise"
    )
    action = models.CharField(max_length=100, verbose_name="Action effectuée")
    target_object = models.CharField(max_length=255, blank=True, default='', verbose_name="Objet ciblé")
    ip_address = models.CharField(max_length=50, blank=True, default='', verbose_name="Adresse IP")
    status = models.CharField(max_length=20, default='SUCCESS', verbose_name="Résultat Action")
    details = models.JSONField(blank=True, default=dict, verbose_name="Détails non sensibles")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Horodatage")

    class Meta:
        verbose_name = "Journal d'audit"
        verbose_name_plural = "Journaux d'audit"
        ordering = ['-created_at']

    def __str__(self):
        usr_str = self.user.username if self.user else "Système"
        return f"[{self.created_at.strftime('%Y-%m-%d %H:%M')}] {usr_str} - {self.action}: {self.target_object}"
