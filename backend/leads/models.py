from django.db import models
from django.core.validators import RegexValidator
from django.contrib.auth.models import User

class Lead(models.Model):
    SOURCE_CHOICES = [
        ('facebook', 'Facebook'),
        ('google', 'Google'),
        ('organic', 'Organic'),
    ]

    STATUS_CHOICES = [
        ('new', 'New'),
        ('contacted', 'Contacted'),
        ('qualified', 'Qualified'),
        ('closed', 'Closed'),
    ]

    phone_regex = RegexValidator(
        regex=r'^\+?[0-9]{7,15}$',
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='leads', null=True, blank=True)
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone_number = models.CharField(validators=[phone_regex], max_length=17)
    lead_source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='organic', db_index=True)
    lead_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new', db_index=True)
    created_date = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_date = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.email})"

    class Meta:
        ordering = ['-created_date']
        constraints = [
            models.UniqueConstraint(fields=['user', 'email'], name='unique_user_lead_email')
        ]

class LeadNote(models.Model):
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='notes')
    content = models.TextField()
    created_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Note for {self.lead.name} at {self.created_date}"

    class Meta:
        ordering = ['-created_date']
