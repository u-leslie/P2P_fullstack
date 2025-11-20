"""
Services for document processing and PO generation
"""
from django.conf import settings
from django.core.files.base import ContentFile
from .models import PurchaseOrder
from .document_processor import DocumentProcessor
from .po_generator import generate_po_pdf
from django.utils import timezone
import os


def generate_purchase_order(purchase_request, generated_by):
    """Generate a purchase order after final approval and create PDF file"""
    # Check if PO already exists
    if hasattr(purchase_request, 'purchase_order'):
        po = purchase_request.purchase_order
        # Regenerate PDF if it doesn't exist
        if not po.file:
            _generate_po_pdf_file(po)
        return po
    
    # Get vendor and items from proforma if available
    vendor_name = "Unknown Vendor"
    vendor_address = ""
    items_data = {"items": []}
    total_amount = purchase_request.amount
    terms = ""
    
    if hasattr(purchase_request, 'proforma') and purchase_request.proforma:
        proforma = purchase_request.proforma
        vendor_name = proforma.vendor_name or vendor_name
        vendor_address = proforma.vendor_address or vendor_address
        items_data = proforma.items_data or items_data
        total_amount = proforma.total_amount or total_amount
        terms = proforma.terms or terms
    
    # If no items from proforma, get from request items
    if not items_data.get('items') and purchase_request.items.exists():
        items_data = {
            'items': [
                {
                    'description': item.description,
                    'quantity': item.quantity,
                    'unit_price': float(item.unit_price),
                    'total': float(item.total_price) if hasattr(item, 'total_price') else float(item.quantity * item.unit_price)
                }
                for item in purchase_request.items.all()
            ]
        }
    
    # Create PO
    po = PurchaseOrder.objects.create(
        request=purchase_request,
        generated_by=generated_by,
        vendor_name=vendor_name,
        vendor_address=vendor_address,
        items_data=items_data,
        total_amount=total_amount,
        terms=terms
    )
    
    # Generate PDF file
    _generate_po_pdf_file(po)
    
    return po


def _generate_po_pdf_file(purchase_order):
    """Generate and save PDF file for purchase order"""
    try:
        # Generate PDF
        pdf_buffer = generate_po_pdf(purchase_order)
        
        # Create filename
        filename = f"PO_{purchase_order.po_number}.pdf"
        
        # Save to file field
        purchase_order.file.save(
            filename,
            ContentFile(pdf_buffer.read()),
            save=True
        )
    except Exception as e:
        # Log error but don't fail PO creation
        print(f"Error generating PO PDF: {e}")
        import traceback
        traceback.print_exc()

