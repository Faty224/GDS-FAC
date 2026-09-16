from django.urls import path
from apps.dashboard.views import dashboard_stats_view

urlpatterns = [
    path('stats/', dashboard_stats_view, name='dashboard-stats'),
]
