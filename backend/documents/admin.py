from django.contrib import admin
from .models import Proforma, PurchaseOrder, Receipt


@admin.register(Proforma)
class ProformaAdmin(admin.ModelAdmin):
    list_display = ['request', 'vendor_name', 'total_amount', 'uploaded_at']
    list_filter = ['uploaded_at']
    search_fields = ['request__title', 'vendor_name']
    readonly_fields = ['uploaded_at', 'extraction_metadata']


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ['po_number', 'request', 'vendor_name', 'total_amount', 'generated_at']
    list_filter = ['generated_at']
    search_fields = ['po_number', 'request__title', 'vendor_name']
    readonly_fields = ['po_number', 'generated_at']


@admin.register(Receipt)
class ReceiptAdmin(admin.ModelAdmin):
    list_display = ['request', 'validation_status', 'uploaded_at', 'validated_at']
    list_filter = ['validation_status', 'uploaded_at']
    search_fields = ['request__title']
    readonly_fields = ['uploaded_at', 'validated_at', 'extracted_data', 'validation_results', 'discrepancies']
