"""
Document processing utilities for extracting data from PDFs and images
using OCR, PDF parsing, and AI/LLM
"""
import os
import json
import pdfplumber
import pytesseract
from PIL import Image
from django.conf import settings
from openai import OpenAI


class DocumentProcessor:
    """Process documents to extract structured data"""
    
    def __init__(self):
        self.openai_client = None
        if settings.OPENAI_API_KEY:
            self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
    
    def extract_text_from_pdf(self, file_path):
        """Extract text from PDF using pdfplumber"""
        text = ""
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            print(f"Error extracting text from PDF: {e}")
        return text
    
    def extract_text_from_image(self, file_path):
        """Extract text from image using OCR"""
        try:
            image = Image.open(file_path)
            text = pytesseract.image_to_string(image)
            return text
        except Exception as e:
            print(f"Error extracting text from image: {e}")
            return ""
    
    def extract_text(self, file_path):
        """Extract text from file (PDF or image)"""
        file_ext = os.path.splitext(file_path)[1].lower()
        
        if file_ext == '.pdf':
            return self.extract_text_from_pdf(file_path)
        elif file_ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp']:
            return self.extract_text_from_image(file_path)
        else:
            return ""
    
    def extract_proforma_data(self, file_path):
        """Extract data from proforma invoice"""
        text = self.extract_text(file_path)
        
        if not text:
            return {
                'vendor_name': '',
                'vendor_address': '',
                'total_amount': None,
                'items_data': {},
                'terms': '',
                'extraction_metadata': {
                    'method': 'text_extraction',
                    'success': False,
                    'error': 'Could not extract text from document'
                }
            }
        
        # Use AI to extract structured data if OpenAI is available
        if self.openai_client:
            return self._extract_with_ai(text, document_type='proforma')
        else:
            # Fallback to basic text parsing
            return self._extract_basic_data(text)
    
    def extract_receipt_data(self, file_path):
        """Extract data from receipt"""
        text = self.extract_text(file_path)
        
        if not text:
            return {
                'vendor_name': '',
                'items': [],
                'total_amount': None,
                'date': None,
                'extraction_metadata': {
                    'method': 'text_extraction',
                    'success': False,
                    'error': 'Could not extract text from document'
                }
            }
        
        # Use AI to extract structured data if OpenAI is available
        if self.openai_client:
            return self._extract_with_ai(text, document_type='receipt')
        else:
            # Fallback to basic text parsing
            return self._extract_basic_receipt_data(text)
    
    def _extract_with_ai(self, text, document_type='proforma'):
        """Use OpenAI to extract structured data from text"""
        try:
            prompt = self._get_extraction_prompt(text, document_type)
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a document extraction assistant. Extract structured data from documents and return valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.1
            )
            
            extracted_data = json.loads(response.choices[0].message.content)
            extracted_data['extraction_metadata'] = {
                'method': 'openai_gpt4',
                'success': True,
                'confidence': 'high'
            }
            return extracted_data
            
        except Exception as e:
            print(f"Error in AI extraction: {e}")
            # Fallback to basic extraction
            if document_type == 'proforma':
                return self._extract_basic_data(text)
            else:
                return self._extract_basic_receipt_data(text)
    
    def _get_extraction_prompt(self, text, document_type):
        """Generate prompt for AI extraction"""
        if document_type == 'proforma':
            return f"""Extract the following information from this proforma invoice document text:

{text}

Return a JSON object with the following structure:
{{
    "vendor_name": "name of the vendor/company",
    "vendor_address": "full address of vendor",
    "total_amount": numeric_value_only,
    "items_data": {{
        "items": [
            {{"description": "item description", "quantity": number, "unit_price": number, "total": number}}
        ]
    }},
    "terms": "payment terms and conditions"
}}

If any field cannot be found, use empty string for text fields, null for numbers, and empty object for objects."""
        else:  # receipt
            return f"""Extract the following information from this receipt document text:

{text}

Return a JSON object with the following structure:
{{
    "vendor_name": "name of the seller/vendor",
    "items": [
        {{"description": "item description", "quantity": number, "unit_price": number, "total": number}}
    ],
    "total_amount": numeric_value_only,
    "date": "date in YYYY-MM-DD format if available"
}}

If any field cannot be found, use empty string for text fields, null for numbers, and empty array for items."""
    
    def _extract_basic_data(self, text):
        """Basic text parsing for proforma (fallback)"""
        # Simple regex-based extraction (can be improved)
        import re
        
        vendor_name = ""
        total_amount = None
        items_data = {}
        
        # Try to find total amount
        amount_patterns = [
            r'total[:\s]+[\$€£]?\s*([\d,]+\.?\d*)',
            r'amount[:\s]+[\$€£]?\s*([\d,]+\.?\d*)',
            r'[\$€£]\s*([\d,]+\.?\d*)',
        ]
        
        for pattern in amount_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    total_amount = float(match.group(1).replace(',', ''))
                    break
                except:
                    pass
        
        # Try to find vendor name (first line or company name pattern)
        lines = text.split('\n')
        if lines:
            vendor_name = lines[0].strip()[:100]
        
        return {
            'vendor_name': vendor_name,
            'vendor_address': '',
            'total_amount': total_amount,
            'items_data': items_data,
            'terms': '',
            'extraction_metadata': {
                'method': 'basic_text_parsing',
                'success': True,
                'confidence': 'low'
            }
        }
    
    def _extract_basic_receipt_data(self, text):
        """Basic text parsing for receipt (fallback)"""
        import re
        
        vendor_name = ""
        total_amount = None
        
        # Try to find total amount
        amount_patterns = [
            r'total[:\s]+[\$€£]?\s*([\d,]+\.?\d*)',
            r'amount[:\s]+[\$€£]?\s*([\d,]+\.?\d*)',
        ]
        
        for pattern in amount_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    total_amount = float(match.group(1).replace(',', ''))
                    break
                except:
                    pass
        
        # Try to find vendor name
        lines = text.split('\n')
        if lines:
            vendor_name = lines[0].strip()[:100]
        
        return {
            'vendor_name': vendor_name,
            'items': [],
            'total_amount': total_amount,
            'date': None,
            'extraction_metadata': {
                'method': 'basic_text_parsing',
                'success': True,
                'confidence': 'low'
            }
        }
    
    def validate_receipt_against_po(self, receipt_data, purchase_order):
        """Validate receipt against purchase order"""
        discrepancies = []
        validation_results = {
            'vendor_match': False,
            'amount_match': False,
            'items_match': False,
            'overall_valid': False
        }
        
        # Check vendor name
        receipt_vendor = receipt_data.get('vendor_name', '').lower().strip()
        po_vendor = purchase_order.vendor_name.lower().strip()
        validation_results['vendor_match'] = receipt_vendor == po_vendor or receipt_vendor in po_vendor or po_vendor in receipt_vendor
        
        if not validation_results['vendor_match']:
            discrepancies.append({
                'type': 'vendor_mismatch',
                'expected': purchase_order.vendor_name,
                'found': receipt_data.get('vendor_name', ''),
                'severity': 'high'
            })
        
        # Check total amount (allow small differences for rounding)
        receipt_amount = receipt_data.get('total_amount')
        po_amount = float(purchase_order.total_amount)
        
        if receipt_amount:
            diff = abs(receipt_amount - po_amount)
            validation_results['amount_match'] = diff < 0.01  # Allow 1 cent difference
            
            if not validation_results['amount_match']:
                discrepancies.append({
                    'type': 'amount_mismatch',
                    'expected': po_amount,
                    'found': receipt_amount,
                    'difference': diff,
                    'severity': 'high'
                })
        
        # Check items (basic check)
        receipt_items = receipt_data.get('items', [])
        po_items = purchase_order.items_data.get('items', [])
        
        if receipt_items and po_items:
            # Simple item count check
            validation_results['items_match'] = len(receipt_items) == len(po_items)
            
            if not validation_results['items_match']:
                discrepancies.append({
                    'type': 'item_count_mismatch',
                    'expected_count': len(po_items),
                    'found_count': len(receipt_items),
                    'severity': 'medium'
                })
        
        # Overall validation
        validation_results['overall_valid'] = (
            validation_results['vendor_match'] and
            validation_results['amount_match'] and
            (not receipt_items or validation_results['items_match'])
        )
        
        return validation_results, discrepancies

