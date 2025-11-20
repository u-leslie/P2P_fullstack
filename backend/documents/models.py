from django.db import models
from django.conf import settings
from .utils import get_document_upload_path


class Proforma(models.Model):
    """Proforma invoice document"""
    
    request = models.OneToOneField(
        'requests.PurchaseRequest',
        on_delete=models.CASCADE,
        related_name='proforma'
    )
    file = models.FileField(upload_to=get_document_upload_path)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    # Extracted data
    vendor_name = models.CharField(max_length=200, blank=True)
    vendor_address = models.TextField(blank=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    items_data = models.JSONField(default=dict, blank=True)  # Store extracted items
    terms = models.TextField(blank=True)
    extraction_metadata = models.JSONField(default=dict, blank=True)  # Store extraction method, confidence, etc.
    
    def __str__(self):
        return f"Proforma for {self.request.title}"


class PurchaseOrder(models.Model):
    """Purchase Order generated after final approval"""
    
    request = models.OneToOneField(
        'requests.PurchaseRequest',
        on_delete=models.CASCADE,
        related_name='purchase_order'
    )
    po_number = models.CharField(max_length=50, unique=True)
    file = models.FileField(upload_to=get_document_upload_path, null=True, blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='generated_pos'
    )
    
    # PO Data
    vendor_name = models.CharField(max_length=200)
    vendor_address = models.TextField(blank=True)
    items_data = models.JSONField(default=dict)  # Store items with quantities, prices
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    terms = models.TextField(blank=True)
    
    def __str__(self):
        return f"PO {self.po_number} - {self.request.title}"
    
    def save(self, *args, **kwargs):
        if not self.po_number:
            # Generate PO number
            from datetime import datetime
            prefix = "PO"
            timestamp = datetime.now().strftime("%Y%m%d")
            last_po = PurchaseOrder.objects.filter(po_number__startswith=f"{prefix}-{timestamp}").order_by('-po_number').first()
            if last_po:
                try:
                    seq = int(last_po.po_number.split('-')[-1]) + 1
                except:
                    seq = 1
            else:
                seq = 1
            self.po_number = f"{prefix}-{timestamp}-{seq:04d}"
        super().save(*args, **kwargs)


class Receipt(models.Model):
    """Receipt document for validation"""
    
    VALIDATION_STATUS_CHOICES = [
        ('pending', 'Pending Validation'),
        ('valid', 'Valid'),
        ('invalid', 'Invalid'),
        ('discrepancy', 'Discrepancy Found'),
    ]
    
    request = models.ForeignKey(
        'requests.PurchaseRequest',
        on_delete=models.CASCADE,
        related_name='receipts'
    )
    file = models.FileField(upload_to=get_document_upload_path)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_receipts'
    )
    
    # Validation data
    validation_status = models.CharField(
        max_length=20,
        choices=VALIDATION_STATUS_CHOICES,
        default='pending'
    )
    extracted_data = models.JSONField(default=dict, blank=True)  # Store extracted receipt data
    validation_results = models.JSONField(default=dict, blank=True)  # Store validation comparison results
    discrepancies = models.JSONField(default=list, blank=True)  # Store any discrepancies found
    validated_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Receipt for {self.request.title} - {self.get_validation_status_display()}"
