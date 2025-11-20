import os
from django.utils import timezone


def get_document_upload_path(instance, filename):
    """Generate upload path for documents"""
    # Get the model name
    model_name = instance.__class__.__name__.lower()
    # Get date for folder structure
    date_str = timezone.now().strftime('%Y/%m/%d')
    # Return path: documents/{model_name}/{year}/{month}/{day}/{filename}
    return os.path.join('documents', model_name, date_str, filename)

