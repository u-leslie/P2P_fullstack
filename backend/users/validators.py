"""
Custom password validators for user passwords
"""
import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _


def validate_password_strength(password):
    """
    Validate that password meets minimum requirements:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one symbol
    """
    errors = []
    
    if len(password) < 8:
        errors.append(ValidationError(
            _("Password must be at least 8 characters long."),
            code='password_too_short',
        ))
    
    if not re.search(r'[A-Z]', password):
        errors.append(ValidationError(
            _("Password must contain at least one uppercase letter."),
            code='password_no_upper',
        ))
    
    if not re.search(r'[a-z]', password):
        errors.append(ValidationError(
            _("Password must contain at least one lowercase letter."),
            code='password_no_lower',
        ))
    
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]', password):
        errors.append(ValidationError(
            _("Password must contain at least one symbol (!@#$%^&* etc.)."),
            code='password_no_symbol',
        ))
    
    if errors:
        raise ValidationError(errors)
    
    return password

