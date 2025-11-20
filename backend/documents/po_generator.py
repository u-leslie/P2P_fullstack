"""
Purchase Order PDF Generator
"""
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from io import BytesIO
from django.conf import settings
from datetime import datetime


def generate_po_pdf(purchase_order):
    """
    Generate a PDF file for a Purchase Order
    
    Args:
        purchase_order: PurchaseOrder instance
        
    Returns:
        BytesIO: PDF file content
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5*inch, bottomMargin=0.5*inch)
    
    # Container for the 'Flowable' objects
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#4B0082'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#6A0DAD'),
        spaceAfter=12
    )
    
    # Title
    title = Paragraph("PURCHASE ORDER", title_style)
    elements.append(title)
    elements.append(Spacer(1, 0.2*inch))
    
    # PO Number and Date
    po_info_data = [
        ['PO Number:', purchase_order.po_number],
        ['Date:', purchase_order.generated_at.strftime('%B %d, %Y') if purchase_order.generated_at else datetime.now().strftime('%B %d, %Y')],
    ]
    
    po_info_table = Table(po_info_data, colWidths=[2*inch, 4*inch])
    po_info_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(po_info_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Vendor Information
    vendor_heading = Paragraph("Vendor Information", heading_style)
    elements.append(vendor_heading)
    
    vendor_data = [
        ['Vendor Name:', purchase_order.vendor_name],
        ['Address:', purchase_order.vendor_address or 'N/A'],
    ]
    
    vendor_table = Table(vendor_data, colWidths=[2*inch, 4*inch])
    vendor_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(vendor_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Request Information
    request_heading = Paragraph("Request Information", heading_style)
    elements.append(request_heading)
    
    request_data = [
        ['Request Title:', purchase_order.request.title],
        ['Description:', purchase_order.request.description[:200] + '...' if len(purchase_order.request.description) > 200 else purchase_order.request.description],
        ['Requested By:', purchase_order.request.created_by.get_full_name() or purchase_order.request.created_by.username],
    ]
    
    request_table = Table(request_data, colWidths=[2*inch, 4*inch])
    request_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(request_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Items Table
    items_heading = Paragraph("Items", heading_style)
    elements.append(items_heading)
    
    # Prepare items data
    items = purchase_order.items_data.get('items', [])
    if not items and purchase_order.request.items.exists():
        # Fallback to request items if PO items not available
        items = [
            {
                'description': item.description,
                'quantity': item.quantity,
                'unit_price': float(item.unit_price),
                'total': float(item.total_price) if hasattr(item, 'total_price') else float(item.quantity * item.unit_price)
            }
            for item in purchase_order.request.items.all()
        ]
    
    # Table header
    items_table_data = [['#', 'Description', 'Quantity', 'Unit Price', 'Total']]
    
    # Add items
    for idx, item in enumerate(items, 1):
        description = item.get('description', 'N/A')
        quantity = item.get('quantity', 0)
        unit_price = item.get('unit_price', 0)
        total = item.get('total', quantity * unit_price)
        
        items_table_data.append([
            str(idx),
            description[:50] + '...' if len(description) > 50 else description,
            str(quantity),
            f"${unit_price:,.2f}",
            f"${total:,.2f}"
        ])
    
    # Add total row
    items_table_data.append([
        '',
        '',
        '',
        'TOTAL:',
        f"${float(purchase_order.total_amount):,.2f}"
    ])
    
    items_table = Table(items_table_data, colWidths=[0.5*inch, 3*inch, 1*inch, 1.2*inch, 1.2*inch])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6A0DAD')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('FONTSIZE', (0, 1), (-1, -2), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -2), 1, colors.grey),
        ('LINEBELOW', (0, -1), (-1, -1), 2, colors.HexColor('#6A0DAD')),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, -1), (-1, -1), 12),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Terms and Conditions
    if purchase_order.terms:
        terms_heading = Paragraph("Terms and Conditions", heading_style)
        elements.append(terms_heading)
        terms_para = Paragraph(purchase_order.terms, styles['Normal'])
        elements.append(terms_para)
        elements.append(Spacer(1, 0.3*inch))
    
    # Approval Signatures
    approval_heading = Paragraph("Approvals", heading_style)
    elements.append(approval_heading)
    
    approval_data = []
    if purchase_order.request.approved_by_level_1:
        approval_data.append([
            'Level 1 Approval:',
            purchase_order.request.approved_by_level_1.get_full_name() or purchase_order.request.approved_by_level_1.username,
            purchase_order.request.approved_at.strftime('%Y-%m-%d') if purchase_order.request.approved_at else 'N/A'
        ])
    if purchase_order.request.approved_by_level_2:
        approval_data.append([
            'Level 2 Approval:',
            purchase_order.request.approved_by_level_2.get_full_name() or purchase_order.request.approved_by_level_2.username,
            purchase_order.request.approved_at.strftime('%Y-%m-%d') if purchase_order.request.approved_at else 'N/A'
        ])
    
    if approval_data:
        approval_table = Table(approval_data, colWidths=[2*inch, 2.5*inch, 1.5*inch])
        approval_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(approval_table)
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer

