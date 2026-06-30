from rest_framework import serializers
from .models import Lead, LeadNote

class LeadNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadNote
        fields = ['id', 'lead', 'content', 'created_date']
        read_only_fields = ['id', 'created_date']

class LeadSerializer(serializers.ModelSerializer):
    notes = LeadNoteSerializer(many=True, read_only=True)

    class Meta:
        model = Lead
        fields = [
            'id', 
            'name', 
            'email', 
            'phone_number', 
            'lead_source', 
            'lead_status', 
            'created_date', 
            'updated_date',
            'notes'
        ]
        read_only_fields = ['id', 'created_date', 'updated_date']

    def validate_email(self, value):
        # Ensure email is in lowercase for normalization
        value = value.lower().strip()
        # DRF UniqueValidator automatically handles the unique check, but we can do extra checks if needed
        return value

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Name cannot be empty.")
        return value.strip()
