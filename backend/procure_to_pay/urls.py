"""
URL configuration for procure_to_pay project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import routers
from rest_framework_simplejwt.views import TokenRefreshView
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

from users.views import login_view, current_user_view, UserRegistrationView
from requests.views import PurchaseRequestViewSet
from documents.views import ProformaViewSet, PurchaseOrderViewSet, ReceiptViewSet

# Swagger/OpenAPI schema
schema_view = get_schema_view(
    openapi.Info(
        title="Procure-to-Pay API",
        default_version='v1',
        description="API documentation for Procure-to-Pay system",
        contact=openapi.Contact(email="support@ist.com"),
    ),
    public=True,
)

# Router for viewsets
router = routers.DefaultRouter()
router.register(r'requests', PurchaseRequestViewSet, basename='request')
router.register(r'proformas', ProformaViewSet, basename='proforma')
router.register(r'purchase-orders', PurchaseOrderViewSet, basename='purchase-order')
router.register(r'receipts', ReceiptViewSet, basename='receipt')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/', include(router.urls)),
    
    # Authentication
    path('api/auth/register/', UserRegistrationView.as_view(), name='register'),
    path('api/auth/login/', login_view, name='login'),
    path('api/auth/me/', current_user_view, name='current-user'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    
    # API documentation
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
