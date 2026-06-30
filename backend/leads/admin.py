from django.contrib import admin
from .models import Lead, LeadNote

class LeadNoteInline(admin.TabularInline):
    model = LeadNote
    extra = 1

@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone_number', 'lead_source', 'lead_status', 'created_date')
    list_filter = ('lead_source', 'lead_status', 'created_date')
    search_fields = ('name', 'email', 'phone_number')
    inlines = [LeadNoteInline]

@admin.register(LeadNote)
class LeadNoteAdmin(admin.ModelAdmin):
    list_display = ('lead', 'content', 'created_date')
    list_filter = ('created_date',)
    search_fields = ('lead__name', 'content')
