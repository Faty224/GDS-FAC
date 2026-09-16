from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.accounts.models import User, UserRole
from apps.companies.models import Company
from apps.customers.models import Customer
from apps.products.models import Product
from apps.billing.models import BillingSettings
from apps.invoices.models import Invoice, InvoiceItem, InvoiceStatus

class APIRoutesTestCase(APITestCase):
    def setUp(self):
        self.company = Company.objects.create(
            raison_sociale="Global Enterprise SA",
            nif="NIF-111222333",
            rccm="RCCM-2026-B-111",
            address="Conakry",
            phone="+224 611 22 33 44",
            email="contact@global.gn"
        )
        self.admin = User.objects.create_user(
            username="admin1",
            email="admin@global.gn",
            password="AdminPassword123!",
            role=UserRole.ADMIN,
            company=self.company
        )
        self.customer = Customer.objects.create(
            company=self.company,
            name="Client Test ERL",
            nifp="NIFP-TEST-001"
        )
        self.product = Product.objects.create(
            company=self.company,
            reference="PROD-01",
            designation="Equipement réseau",
            unit_price=Decimal('500000.00'),
            vat_rate=Decimal('18.00')
        )
        self.billing_settings = BillingSettings.objects.create(
            company=self.company,
            prefix="FAC-2026-",
            next_number=1
        )
        self.client.force_authenticate(user=self.admin)

    def test_login_flow(self):
        """Vérifie le fonctionnement de l'endpoint d'authentification."""
        response = self.client.post('/api/auth/login/', {
            'username': 'admin1',
            'password': 'AdminPassword123!'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)

    def test_customer_crud(self):
        """Vérifie la création et la liste des clients."""
        response = self.client.post('/api/customers/', {
            'name': 'Société Nouvelle Guinée',
            'nifp': 'NIFP-999000',
            'email': 'sng@guinee.gn',
            'phone': '+224 620 99 88 77',
            'address': 'Kaloum, Conakry'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Société Nouvelle Guinée')

        list_resp = self.client.get('/api/customers/')
        self.assertEqual(list_resp.status_code, status.HTTP_200_OK)

    def test_invoice_create_validate_and_pdf(self):
        """Vérifie le cycle complet de création, validation, PDF et transmission d'une facture."""
        # 1. Create Invoice Draft
        create_resp = self.client.post('/api/invoices/', {
            'customer': self.customer.id,
            'items': [
                {
                    'product': self.product.id,
                    'designation': self.product.designation,
                    'quantity': 2,
                    'unit_price': 500000,
                    'vat_rate': 18
                }
            ]
        }, format='json')
        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)
        invoice_id = create_resp.data['id']

        # 2. Validate Invoice
        val_resp = self.client.post(f'/api/invoices/{invoice_id}/validate/')
        self.assertEqual(val_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(val_resp.data['status'], InvoiceStatus.VALIDATED)
        self.assertTrue(val_resp.data['number'].startswith('FAC-2026-'))

        # 3. Download PDF
        pdf_resp = self.client.get(f'/api/invoices/{invoice_id}/pdf/')
        self.assertEqual(pdf_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(pdf_resp['Content-Type'], 'application/pdf')

        # 4. Transmit eTVA
        etva_resp = self.client.post(f'/api/invoices/{invoice_id}/transmit_etva/')
        self.assertEqual(etva_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(etva_resp.data['etva_status'], 'ACCEPTED')

    def test_dashboard_stats(self):
        """Vérifie la mise à disposition des métriques pour le tableau de bord."""
        response = self.client.get('/api/dashboard/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('kpi', response.data)
        self.assertIn('charts', response.data)
