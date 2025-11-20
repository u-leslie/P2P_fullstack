from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from .models import Proforma, PurchaseOrder, Receipt
from .serializers import ProformaSerializer, PurchaseOrderSerializer, ReceiptSerializer
from .document_processor import DocumentProcessor
from requests.models import PurchaseRequest


class ProformaViewSet(viewsets.ModelViewSet):
    """ViewSet for proforma documents"""
    queryset = Proforma.objects.all()
    serializer_class = ProformaSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter based on user role"""
        user = self.request.user
        if user.is_staff_role():
            return Proforma.objects.filter(request__created_by=user)
        elif user.is_approver() or user.is_finance():
            return Proforma.objects.all()
        return Proforma.objects.none()
    
    def create(self, request, *args, **kwargs):
        """Upload and process proforma"""
        request_id = request.data.get('request')
        
        try:
            purchase_request = PurchaseRequest.objects.get(id=request_id)
        except PurchaseRequest.DoesNotExist:
            return Response(
                {'error': 'Purchase request not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check permissions
        if purchase_request.created_by != request.user and not request.user.is_finance():
            return Response(
                {'error': 'You do not have permission to upload proforma for this request'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if proforma already exists
        if hasattr(purchase_request, 'proforma'):
            return Response(
                {'error': 'Proforma already exists for this request'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        proforma = serializer.save()
        
        # Process document to extract data
        processor = DocumentProcessor()
        try:
            extracted_data = processor.extract_proforma_data(proforma.file.path)
            
            # Update proforma with extracted data
            proforma.vendor_name = extracted_data.get('vendor_name', '')
            proforma.vendor_address = extracted_data.get('vendor_address', '')
            proforma.total_amount = extracted_data.get('total_amount')
            proforma.items_data = extracted_data.get('items_data', {})
            proforma.terms = extracted_data.get('terms', '')
            proforma.extraction_metadata = extracted_data.get('extraction_metadata', {})
            proforma.save()
            
        except Exception as e:
            # Log error but don't fail the upload
            print(f"Error processing proforma: {e}")
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PurchaseOrderViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for purchase orders (read-only)"""
    queryset = PurchaseOrder.objects.all()
    serializer_class = PurchaseOrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter based on user role"""
        user = self.request.user
        if user.is_staff_role():
            return PurchaseOrder.objects.filter(request__created_by=user)
        elif user.is_approver() or user.is_finance():
            return PurchaseOrder.objects.all()
        return PurchaseOrder.objects.none()


class ReceiptViewSet(viewsets.ModelViewSet):
    """ViewSet for receipts"""
    queryset = Receipt.objects.all()
    serializer_class = ReceiptSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter based on user role"""
        user = self.request.user
        if user.is_staff_role():
            return Receipt.objects.filter(request__created_by=user)
        elif user.is_approver() or user.is_finance():
            return Receipt.objects.all()
        return Receipt.objects.none()
    
    def create(self, request, *args, **kwargs):
        """Upload and validate receipt"""
        request_id = request.data.get('request')
        
        try:
            purchase_request = PurchaseRequest.objects.get(id=request_id)
        except PurchaseRequest.DoesNotExist:
            return Response(
                {'error': 'Purchase request not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check permissions
        if purchase_request.created_by != request.user and not request.user.is_finance():
            return Response(
                {'error': 'You do not have permission to upload receipt for this request'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if request is approved
        if purchase_request.status != 'approved':
            return Response(
                {'error': 'Receipt can only be uploaded for approved requests'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        receipt = serializer.save(uploaded_by=request.user)
        
        # Process and validate receipt
        processor = DocumentProcessor()
        try:
            extracted_data = processor.extract_receipt_data(receipt.file.path)
            receipt.extracted_data = extracted_data
            
            # Validate against PO if exists
            if hasattr(purchase_request, 'purchase_order'):
                po = purchase_request.purchase_order
                validation_results, discrepancies = processor.validate_receipt_against_po(
                    extracted_data, po
                )
                
                receipt.validation_results = validation_results
                receipt.discrepancies = discrepancies
                
                if validation_results['overall_valid']:
                    receipt.validation_status = 'valid'
                elif discrepancies:
                    receipt.validation_status = 'discrepancy'
                else:
                    receipt.validation_status = 'invalid'
                
                receipt.validated_at = timezone.now()
            
            receipt.save()
            
        except Exception as e:
            # Log error but don't fail the upload
            print(f"Error processing receipt: {e}")
            receipt.validation_status = 'pending'
            receipt.save()
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def validate(self, request, pk=None):
        """Re-validate receipt"""
        receipt = self.get_object()
        
        if not hasattr(receipt.request, 'purchase_order'):
            return Response(
                {'error': 'No purchase order found for this request'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        processor = DocumentProcessor()
        try:
            extracted_data = processor.extract_receipt_data(receipt.file.path)
            receipt.extracted_data = extracted_data
            
            po = receipt.request.purchase_order
            validation_results, discrepancies = processor.validate_receipt_against_po(
                extracted_data, po
            )
            
            receipt.validation_results = validation_results
            receipt.discrepancies = discrepancies
            
            if validation_results['overall_valid']:
                receipt.validation_status = 'valid'
            elif discrepancies:
                receipt.validation_status = 'discrepancy'
            else:
                receipt.validation_status = 'invalid'
            
            receipt.validated_at = timezone.now()
            receipt.save()
            
            serializer = self.get_serializer(receipt)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': f'Error validating receipt: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
