from rest_framework import serializers
from .models import Proforma, PurchaseOrder, Receipt


class ProformaSerializer(serializers.ModelSerializer):
    """Serializer for proforma documents"""
    
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Proforma
        fields = [
            'id', 'request', 'file', 'file_url', 'uploaded_at',
            'vendor_name', 'vendor_address', 'total_amount',
            'items_data', 'terms', 'extraction_metadata'
        ]
        read_only_fields = ['id', 'uploaded_at', 'extraction_metadata']
    
    def get_file_url(self, obj):
        return obj.file.url if obj.file else None


class PurchaseOrderSerializer(serializers.ModelSerializer):
    """Serializer for purchase orders"""
    
    file_url = serializers.SerializerMethodField()
    generated_by_username = serializers.CharField(source='generated_by.username', read_only=True)
    
    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'request', 'po_number', 'file', 'file_url',
            'generated_at', 'generated_by', 'generated_by_username',
            'vendor_name', 'vendor_address', 'items_data',
            'total_amount', 'terms'
        ]
        read_only_fields = ['id', 'po_number', 'generated_at', 'generated_by']
    
    def get_file_url(self, obj):
        return obj.file.url if obj.file else None


class ReceiptSerializer(serializers.ModelSerializer):
    """Serializer for receipts"""
    
    file_url = serializers.SerializerMethodField()
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)
    
    class Meta:
        model = Receipt
        fields = [
            'id', 'request', 'file', 'file_url', 'uploaded_at',
            'uploaded_by', 'uploaded_by_username', 'validation_status',
            'extracted_data', 'validation_results', 'discrepancies',
            'validated_at'
        ]
        read_only_fields = [
            'id', 'uploaded_at', 'uploaded_by', 'validation_status',
            'extracted_data', 'validation_results', 'discrepancies',
            'validated_at'
        ]
    
    def get_file_url(self, obj):
        return obj.file.url if obj.file else None

