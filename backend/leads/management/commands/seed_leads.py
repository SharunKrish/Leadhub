import random
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from leads.models import Lead, LeadNote

class Command(BaseCommand):
    help = 'Seeds the database with realistic mock lead data'

    def handle(self, *args, **kwargs):
        self.stdout.write("Deleting existing leads...")
        Lead.objects.all().delete()

        first_names = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen"]
        last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"]

        sources = ['facebook', 'google', 'organic']
        statuses = ['new', 'contacted', 'qualified', 'closed']

        notes_pool = [
            "Left a voicemail, waiting for reply.",
            "Interested in our summer pricing packages.",
            "Spoke on call. Scheduled a demo for tomorrow.",
            "Requested more details via email.",
            "Invalid number initially, sent follow-up email.",
            "Referred by a partner. High value lead.",
            "Decided to think about it and call back next week.",
            "Qualified for enterprise package.",
            "Not interested at the moment.",
        ]

        leads_to_create = []
        now = timezone.now()

        # Generate some leads over the last 14 days
        for i in range(50):
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
            name = f"{first_name} {last_name}"
            email = f"{first_name.lower()}.{last_name.lower()}.{random.randint(100,999)}@example.com"
            
            # Generate a standard US-like phone number format
            phone = f"+1{random.randint(200,999)}{random.randint(100,999)}{random.randint(1000,9999)}"
            
            source = random.choice(sources)
            status = random.choice(statuses)
            
            # Diverse creation dates
            days_ago = random.randint(0, 14)
            hours_ago = random.randint(0, 23)
            created_date = now - timedelta(days=days_ago, hours=hours_ago)

            lead = Lead(
                name=name,
                email=email,
                phone_number=phone,
                lead_source=source,
                lead_status=status,
            )
            # We override created_date after saving, or we can set it and save it.
            # To set auto_now_add fields, we save then update the field and save again or use save(force_insert/update)
            leads_to_create.append((lead, created_date))

        # Save leads and update created_date
        for lead, created_date in leads_to_create:
            lead.save()
            # Set the auto_now_add field explicitly using update
            Lead.objects.filter(id=lead.id).update(created_date=created_date)
            
            # Re-fetch lead to add notes if needed
            lead.refresh_from_db()
            # Add some notes randomly
            if random.random() > 0.4:
                num_notes = random.randint(1, 3)
                for _ in range(num_notes):
                    # Note created slightly after the lead
                    note_date = created_date + timedelta(hours=random.randint(1, 48))
                    if note_date > now:
                        note_date = now
                    note = LeadNote(
                        lead=lead,
                        content=random.choice(notes_pool)
                    )
                    note.save()
                    LeadNote.objects.filter(id=note.id).update(created_date=note_date)

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {Lead.objects.count()} leads and {LeadNote.objects.count()} notes!"))
