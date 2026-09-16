from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/users/', include('apps.accounts.urls_users')),
    path('api/company/', include('apps.companies.urls')),
    path('api/customers/', include('apps.customers.urls')),
    path('api/products/', include('apps.products.urls')),
    path('api/billing/', include('apps.billing.urls')),
    path('api/invoices/', include('apps.invoices.urls')),
    path('api/credit-notes/', include('apps.credit_notes.urls')),
    path('api/etva/', include('apps.etva.urls')),
    path('api/audit/', include('apps.audit.urls')),
    path('api/dashboard/', include('apps.dashboard.urls')),
]
