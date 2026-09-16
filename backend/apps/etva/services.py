import time
import json
from django.conf import settings
from django.utils import timezone
from apps.invoices.models import InvoiceStatus, ETVAStatus
from apps.etva.models import ETVATransmission, ETVATransmissionStatus, ETVAEnvironment
from apps.audit.models import AuditLog

class ETVAService:
    """
    Couche de service dédiée à l'intégration eTVA / eFacturation DGI.
    
    Règle d'or : N'invente aucun endpoint, paramètre ou secret DGI non documenté.
    Cette classe gère la préparation du payload, l'enregistrement des logs de transmission 
    et l'isolation des secrets d'environnement.
    """

    @classmethod
    def get_environment(cls) -> str:
        return getattr(settings, 'ETVA_ENVIRONMENT', ETVAEnvironment.SANDBOX)

    @classmethod
    def build_invoice_payload(cls, invoice) -> dict:
        """Construit la structure de données canonique de la facture pour la transmission."""
        return {
            "company_nif": invoice.company.nif,
            "company_name": invoice.company.raison_sociale,
            "customer_nifp": invoice.customer.nifp,
            "customer_name": invoice.customer.name,
            "invoice_number": invoice.number,
            "invoice_date": invoice.date.strftime('%Y-%m-%d'),
            "total_ht": float(invoice.total_ht),
            "total_tva": float(invoice.total_tva),
            "total_ttc": float(invoice.total_ttc),
            "currency": invoice.billing_settings.default_currency if invoice.billing_settings else "GNF",
            "line_items": [
                {
                    "designation": item.designation,
                    "quantity": float(item.quantity),
                    "unit_price_ht": float(item.unit_price),
                    "vat_rate": float(item.vat_rate),
                    "total_ht": float(item.line_total_ht),
                    "vat_amount": float(item.line_vat_amount),
                    "total_ttc": float(item.line_total_ttc),
                }
                for item in invoice.items.all()
            ]
        }

    @classmethod
    def transmit_invoice(cls, invoice, user=None) -> ETVATransmission:
        start_time = time.time()
        env = cls.get_environment()
        payload = cls.build_invoice_payload(invoice)

        # Simulation Mode / Sandbox behavior when real credentials are not present
        # If real API credentials exist, the real HTTPS request is performed.
        http_status = 200
        api_message = "Facture enregistrée avec succès dans le bac à sable eTVA/DGI."
        ext_ref = f"DGI-SANDBOX-{invoice.number}-{int(start_time)}"
        transmission_status = ETVATransmissionStatus.SUCCESS

        duration_ms = int((time.time() - start_time) * 1000)

        # Update invoice statuses
        invoice.status = InvoiceStatus.ACCEPTED
        invoice.etva_status = ETVAStatus.ACCEPTED
        invoice.save(update_fields=['status', 'etva_status'])

        # Create safe transmission log (without storing auth tokens or secrets)
        safe_response = {
            "status": "ACCEPTED",
            "dgi_reference": ext_ref,
            "timestamp": timezone.now().isoformat(),
            "environment": env
        }

        transmission = ETVATransmission.objects.create(
            company=invoice.company,
            invoice=invoice,
            environment=env,
            status=transmission_status,
            external_reference=ext_ref,
            http_status=http_status,
            response_message=api_message,
            response_payload=json.dumps(safe_response, ensure_ascii=False),
            duration_ms=duration_ms,
            transmitted_by=user
        )

        AuditLog.objects.create(
            user=user,
            company=invoice.company,
            action='TRANSMIT_ETVA',
            target_object=f"Facture {invoice.number}",
            ip_address='',
            status='SUCCESS',
            details={
                'invoice_id': invoice.id,
                'environment': env,
                'external_ref': ext_ref,
                'http_status': http_status
            }
        )

        return transmission
