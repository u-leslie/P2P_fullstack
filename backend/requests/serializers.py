from rest_framework import serializers
from .models import PurchaseRequest, RequestItem
from users.serializers import UserSerializer


class RequestItemSerializer(serializers.ModelSerializer):
    """Serializer for request items"""
    
    total_price = serializers.ReadOnlyField()
    
    class Meta:
        model = RequestItem
        fields = ['id', 'description', 'quantity', 'unit_price', 'total_price']


class PurchaseRequestSerializer(serializers.ModelSerializer):
    """Serializer for purchase requests"""
    
    created_by = UserSerializer(read_only=True)
    approved_by_level_1 = UserSerializer(read_only=True)
    approved_by_level_2 = UserSerializer(read_only=True)
    items = RequestItemSerializer(many=True, read_only=True)
    can_be_edited = serializers.ReadOnlyField()
    requires_level_1_approval = serializers.ReadOnlyField()
    requires_level_2_approval = serializers.ReadOnlyField()
    proforma = serializers.SerializerMethodField()
    purchase_order = serializers.SerializerMethodField()
    receipts = serializers.SerializerMethodField()
    
    class Meta:
        model = PurchaseRequest
        fields = [
            'id', 'title', 'description', 'amount', 'status',
            'created_by', 'approved_by_level_1', 'approved_by_level_2',
            'created_at', 'updated_at', 'approved_at', 'rejected_at',
            'rejection_reason', 'items', 'can_be_edited',
            'requires_level_1_approval', 'requires_level_2_approval',
            'proforma', 'purchase_order', 'receipts'
        ]
        read_only_fields = [
            'id', 'created_by', 'status', 'approved_by_level_1',
            'approved_by_level_2', 'created_at', 'updated_at',
            'approved_at', 'rejected_at'
        ]
    
    def get_proforma(self, obj):
        if hasattr(obj, 'proforma'):
            return {
                'id': obj.proforma.id,
                'file': obj.proforma.file.url if obj.proforma.file else None,
                'vendor_name': obj.proforma.vendor_name,
                'total_amount': str(obj.proforma.total_amount) if obj.proforma.total_amount else None,
                'uploaded_at': obj.proforma.uploaded_at,
            }
        return None
    
    def get_purchase_order(self, obj):
        if hasattr(obj, 'purchase_order'):
            return {
                'id': obj.purchase_order.id,
                'po_number': obj.purchase_order.po_number,
                'file': obj.purchase_order.file.url if obj.purchase_order.file else None,
                'vendor_name': obj.purchase_order.vendor_name,
                'total_amount': str(obj.purchase_order.total_amount),
                'generated_at': obj.purchase_order.generated_at,
            }
        return None
    
    def get_receipts(self, obj):
        receipts = obj.receipts.all()
        return [
            {
                'id': r.id,
                'file': r.file.url if r.file else None,
                'validation_status': r.validation_status,
                'uploaded_at': r.uploaded_at,
                'validated_at': r.validated_at,
                'discrepancies': r.discrepancies,
            }
            for r in receipts
        ]


class PurchaseRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating purchase requests with items"""
    
    items = RequestItemSerializer(many=True, required=False)
    
    class Meta:
        model = PurchaseRequest
        fields = ['title', 'description', 'amount', 'items']
    
    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        request = PurchaseRequest.objects.create(**validated_data)
        for item_data in items_data:
            RequestItem.objects.create(request=request, **item_data)
        return request


class PurchaseRequestUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating purchase requests"""
    
    items = RequestItemSerializer(many=True, required=False)
    
    class Meta:
        model = PurchaseRequest
        fields = ['title', 'description', 'amount', 'items']
    
    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        
        # Update request fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update items if provided
        if items_data is not None:
            # Delete existing items
            instance.items.all().delete()
            # Create new items
            for item_data in items_data:
                RequestItem.objects.create(request=instance, **item_data)
        
        return instance

