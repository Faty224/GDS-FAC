from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.accounts.views import (
    UserViewSet, login_view, logout_view, profile_view, change_password_view
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('login/', login_view, name='auth-login'),
    path('logout/', logout_view, name='auth-logout'),
    path('me/', profile_view, name='auth-profile'),
    path('change-password/', change_password_view, name='auth-change-password'),
    path('', include(router.urls)),
]
