"""
Management command to seed initial users for the Procure-to-Pay system.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed initial users (staff, approvers, finance) for the application'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force creation even if users already exist',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        force = options['force']
        
        users_data = [
            {
                'username': 'staff',
                'email': 'staff@p2p.com',
                'password': 'Test@123',
                'first_name': 'John',
                'last_name': 'Staff',
                'role': 'staff',
                'department': 'Operations',
            },
            {
                'username': 'approve1',
                'email': 'approve1@p2p.com',
                'password': 'Test@123',
                'first_name': 'Jane',
                'last_name': 'Approver',
                'role': 'approver_level_1',
                'department': 'Management',
            },
            {
                'username': 'approve2',
                'email': 'approve2@p2p.com',
                'password': 'Test@123',
                'first_name': 'Bob',
                'last_name': 'Manager',
                'role': 'approver_level_2',
                'department': 'Senior Management',
            },
            {
                'username': 'finance',
                'email': 'finance@p2p.com',
                'password': 'Test@123',
                'first_name': 'Alice',
                'last_name': 'Finance',
                'role': 'finance',
                'department': 'Finance',
            },
        ]

        created_count = 0
        skipped_count = 0

        for user_data in users_data:
            username = user_data['username']
            password = user_data.pop('password')
            
            if User.objects.filter(username=username).exists():
                if force:
                    user = User.objects.get(username=username)
                    for key, value in user_data.items():
                        setattr(user, key, value)
                    user.set_password(password)
                    user.save()
                    self.stdout.write(
                        self.style.WARNING(f'Updated user: {username}')
                    )
                    created_count += 1
                else:
                    self.stdout.write(
                        self.style.WARNING(f'Skipped existing user: {username}')
                    )
                    skipped_count += 1
            else:
                user = User.objects.create_user(**user_data)
                user.set_password(password)
                user.save()
                self.stdout.write(
                    self.style.SUCCESS(f'Created user: {username} ({user.get_role_display()})')
                )
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'\nSeeding complete! Created/Updated: {created_count}, Skipped: {skipped_count}'
            )
        )
        self.stdout.write(
            self.style.SUCCESS('\nDefault login credentials (use email to login):')
        )
        self.stdout.write('  Staff: staff@p2p.com / Test@123')
        self.stdout.write('  Approver Level 1: approve1@p2p.com / Test@123')
        self.stdout.write('  Approver Level 2: approve2@p2p.com / Test@123')
        self.stdout.write('  Finance: finance@p2p.com / Test@123')

