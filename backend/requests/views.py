from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Q
from .models import PurchaseRequest
from .serializers import (
    PurchaseRequestSerializer,
    PurchaseRequestCreateSerializer,
    PurchaseRequestUpdateSerializer
)


class IsStaff(permissions.BasePermission):
    """Permission for staff users"""
    def has_permission(self, request, view):
        return request.user and request.user.is_staff_role()


class IsApprover(permissions.BasePermission):
    """Permission for approver users"""
    def has_permission(self, request, view):
        return request.user and request.user.is_approver()


class IsFinance(permissions.BasePermission):
    """Permission for finance users"""
    def has_permission(self, request, view):
        return request.user and request.user.is_finance()


class PurchaseRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for purchase requests"""
    queryset = PurchaseRequest.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PurchaseRequestCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PurchaseRequestUpdateSerializer
        return PurchaseRequestSerializer
    
    def get_queryset(self):
        """Filter queryset based on user role"""
        user = self.request.user
        
        if user.is_staff_role():
            # Staff can only see their own requests
            return PurchaseRequest.objects.filter(created_by=user)
        elif user.is_approver():
            # Approvers can see pending requests and their reviewed requests
            return PurchaseRequest.objects.filter(
                Q(status='pending') |
                Q(approved_by_level_1=user) |
                Q(approved_by_level_2=user)
            )
        elif user.is_finance():
            # Finance can see all approved requests
            return PurchaseRequest.objects.filter(status='approved')
        else:
            return PurchaseRequest.objects.none()
    
    def perform_create(self, serializer):
        """Set the creator when creating a request"""
        serializer.save(created_by=self.request.user)
    
    def update(self, request, *args, **kwargs):
        """Update request - only if pending and created by user"""
        instance = self.get_object()
        
        if not instance.can_be_edited():
            return Response(
                {'error': 'Only pending requests can be edited'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if instance.created_by != request.user and not request.user.is_finance():
            return Response(
                {'error': 'You can only edit your own requests'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'], permission_classes=[IsApprover])
    def approve(self, request, pk=None):
        """Approve request at appropriate level"""
        purchase_request = self.get_object()
        
        if purchase_request.status != 'pending':
            return Response(
                {'error': 'Only pending requests can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            # Determine which level to approve
            if purchase_request.requires_level_1_approval():
                if not request.user.is_approver_level_1():
                    return Response(
                        {'error': 'You do not have permission to approve at level 1'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                success = purchase_request.approve_level_1(request.user)
            elif purchase_request.requires_level_2_approval():
                if not request.user.is_approver_level_2():
                    return Response(
                        {'error': 'You do not have permission to approve at level 2'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                success = purchase_request.approve_level_2(request.user)
            else:
                return Response(
                    {'error': 'Request does not require approval at this level'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if success:
                # Generate PO if fully approved
                if purchase_request.status == 'approved':
                    from documents.models import PurchaseOrder
                    from documents.services import generate_purchase_order
                    generate_purchase_order(purchase_request, request.user)
                
                serializer = self.get_serializer(purchase_request)
                return Response(serializer.data)
            else:
                return Response(
                    {'error': 'Failed to approve request'},
                    status=status.HTTP_400_BAD_REQUEST
                )
    
    @action(detail=True, methods=['patch'], permission_classes=[IsApprover])
    def reject(self, request, pk=None):
        """Reject request"""
        purchase_request = self.get_object()
        
        if purchase_request.status != 'pending':
            return Response(
                {'error': 'Only pending requests can be rejected'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reason = request.data.get('reason', '')
        
        with transaction.atomic():
            success = purchase_request.reject(request.user, reason)
            
            if success:
                serializer = self.get_serializer(purchase_request)
                return Response(serializer.data)
            else:
                return Response(
                    {'error': 'Failed to reject request'},
                    status=status.HTTP_400_BAD_REQUEST
                )
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def history(self, request, pk=None):
        """Get approval history for a request"""
        purchase_request = self.get_object()
        
        history = []
        if purchase_request.approved_by_level_1:
            history.append({
                'level': 1,
                'approver': purchase_request.approved_by_level_1.username,
                'action': 'approved' if purchase_request.status != 'rejected' else 'rejected',
                'timestamp': purchase_request.updated_at
            })
        if purchase_request.approved_by_level_2:
            history.append({
                'level': 2,
                'approver': purchase_request.approved_by_level_2.username,
                'action': 'approved' if purchase_request.status != 'rejected' else 'rejected',
                'timestamp': purchase_request.approved_at or purchase_request.rejected_at
            })
        
        return Response({'history': history})
