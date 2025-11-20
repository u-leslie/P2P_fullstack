from django.contrib import admin
from .models import PurchaseRequest, RequestItem


class RequestItemInline(admin.TabularInline):
    model = RequestItem
    extra = 1


@admin.register(PurchaseRequest)
class PurchaseRequestAdmin(admin.ModelAdmin):
    list_display = ['title', 'amount', 'status', 'created_by', 'created_at', 'approved_at']
    list_filter = ['status', 'created_at']
    search_fields = ['title', 'description', 'created_by__username']
    readonly_fields = ['created_at', 'updated_at', 'approved_at', 'rejected_at']
    inlines = [RequestItemInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'amount', 'status')
        }),
        ('Approval Information', {
            'fields': ('created_by', 'approved_by_level_1', 'approved_by_level_2',
                      'approved_at', 'rejected_at', 'rejection_reason')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
