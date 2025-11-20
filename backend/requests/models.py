from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator


class PurchaseRequest(models.Model):
    """Purchase Request model with multi-level approval workflow"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_requests'
    )
    
    # Approval tracking
    approved_by_level_1 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_level_1_requests'
    )
    approved_by_level_2 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_level_2_requests'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    rejected_at = models.DateTimeField(null=True, blank=True)
    
    # Rejection reason
    rejection_reason = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['created_by', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.get_status_display()} ({self.amount})"
    
    def can_be_edited(self):
        """Only pending requests can be edited"""
        return self.status == 'pending'
    
    def requires_level_1_approval(self):
        """Check if level 1 approval is needed"""
        return self.status == 'pending' and not self.approved_by_level_1
    
    def requires_level_2_approval(self):
        """Check if level 2 approval is needed"""
        return self.status == 'pending' and self.approved_by_level_1 and not self.approved_by_level_2
    
    def is_fully_approved(self):
        """Check if all required approvals are complete"""
        return self.approved_by_level_1 is not None and self.approved_by_level_2 is not None
    
    def approve_level_1(self, approver):
        """Approve at level 1"""
        if self.requires_level_1_approval():
            self.approved_by_level_1 = approver
            if not self.requires_level_2_approval():
                self.status = 'approved'
                from django.utils import timezone
                self.approved_at = timezone.now()
            self.save()
            return True
        return False
    
    def approve_level_2(self, approver):
        """Approve at level 2 (final approval)"""
        if self.requires_level_2_approval():
            self.approved_by_level_2 = approver
            self.status = 'approved'
            from django.utils import timezone
            self.approved_at = timezone.now()
            self.save()
            return True
        return False
    
    def reject(self, approver, reason=''):
        """Reject the request"""
        if self.status == 'pending':
            self.status = 'rejected'
            self.rejection_reason = reason
            from django.utils import timezone
            self.rejected_at = timezone.now()
            # Set approver based on which level is rejecting
            if not self.approved_by_level_1:
                self.approved_by_level_1 = approver
            else:
                self.approved_by_level_2 = approver
            self.save()
            return True
        return False


class RequestItem(models.Model):
    """Individual items in a purchase request"""
    
    request = models.ForeignKey(
        PurchaseRequest,
        on_delete=models.CASCADE,
        related_name='items'
    )
    description = models.CharField(max_length=200)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    
    @property
    def total_price(self):
        return self.quantity * self.unit_price
    
    def __str__(self):
        return f"{self.description} - {self.quantity} x {self.unit_price}"
