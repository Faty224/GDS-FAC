from decimal import Decimal
from django.test import TestCase
from apps.accounts.models import User, UserRole
from apps.companies.models import Company
from apps.customers.models import Customer
from apps.products.models import Product
from apps.billing.models import BillingSettings
from apps.invoices.models import Invoice, InvoiceItem, InvoiceStatus
from apps.credit_notes.models import CreditNote, CreditNoteItem

class ModelsTestCase(TestCase):
    def setUp(self):
        self.company = Company.objects.create(
            raison_sociale="Alpha Tech SARL",
            nif="NIF-999888777",
            rccm="RCCM-2026-B-999",
            address="Conakry Centre",
            phone="+224 600 00 00 00",
            email="info@alphatech.gn"
        )
        self.user = User.objects.create_user(
            username="facturier1",
            email="facturier@alphatech.gn",
            password="Password123!",
            role=UserRole.FACTURIER,
            company=self.company
        )
        self.customer = Customer.objects.create(
            company=self.company,
            name="SOGUIBAP SA",
            nifp="NIFP-CLIENT-123",
            email="contact@soguibap.gn",
            phone="+224 622 11 22 33"
        )
        self.product = Product.objects.create(
            company=self.company,
            reference="SERV-IT-01",
            designation="Développement Web & Integration",
            unit_price=Decimal('1000000.00'),
            vat_rate=Decimal('18.00')
        )
        self.billing_settings = BillingSettings.objects.create(
            company=self.company,
            prefix="FAC-2026-",
            next_number=1
        )

    def test_invoice_calculation(self):
        """Vérifie le calcul sécurisé des montants HT, TVA et TTC côté backend."""
        invoice = Invoice.objects.create(
            company=self.company,
            customer=self.customer,
            billing_settings=self.billing_settings,
            created_by=self.user
        )

        InvoiceItem.objects.create(
            invoice=invoice,
            product=self.product,
            designation=self.product.designation,
            quantity=Decimal('2.00'),
            unit_price=Decimal('1000000.00'),
            vat_rate=Decimal('18.00')
        )

        invoice.refresh_from_db()
        self.assertEqual(invoice.total_ht, Decimal('2000000.00'))
        self.assertEqual(invoice.total_tva, Decimal('360000.00'))
        self.assertEqual(invoice.total_ttc, Decimal('2360000.00'))

    def test_credit_note_link(self):
        """Vérifie la création d'un avoir lié à une facture parente."""
        invoice = Invoice.objects.create(
            company=self.company,
            customer=self.customer,
            number="FAC-2026-0001",
            status=InvoiceStatus.VALIDATED,
            created_by=self.user
        )

        credit_note = CreditNote.objects.create(
            company=self.company,
            parent_invoice=invoice,
            customer=self.customer,
            reason="Ajustement d'erreur de quantité",
            created_by=self.user
        )

        CreditNoteItem.objects.create(
            credit_note=credit_note,
            designation="Correction ligne 1",
            quantity=Decimal('1.00'),
            unit_price=Decimal('500000.00'),
            vat_rate=Decimal('18.00')
        )

        credit_note.refresh_from_db()
        self.assertEqual(credit_note.parent_invoice.id, invoice.id)
        self.assertEqual(credit_note.total_ht, Decimal('500000.00'))
        self.assertEqual(credit_note.total_tva, Decimal('90000.00'))
        self.assertEqual(credit_note.total_ttc, Decimal('590000.00'))
