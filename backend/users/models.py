from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom User model with role-based access control"""
    
    ROLE_CHOICES = [
        ('staff', 'Staff'),
        ('approver_level_1', 'Approver Level 1'),
        ('approver_level_2', 'Approver Level 2'),
        ('finance', 'Finance'),
    ]
    
    # Override email to make it unique and required
    email = models.EmailField(unique=True, blank=False, null=False)
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='staff')
    department = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    
    def is_staff_role(self):
        return self.role == 'staff'
    
    def is_approver_level_1(self):
        return self.role == 'approver_level_1'
    
    def is_approver_level_2(self):
        return self.role == 'approver_level_2'
    
    def is_finance(self):
        return self.role == 'finance'
    
    def is_approver(self):
        return self.role in ['approver_level_1', 'approver_level_2']
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
