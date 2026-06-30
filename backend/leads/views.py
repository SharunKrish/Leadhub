import csv
import io
import openpyxl
from django.http import HttpResponse
from django.db.models import Q, Count
from django.utils import timezone
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination

from .models import Lead, LeadNote
from .serializers import LeadSerializer, LeadNoteSerializer

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class LeadViewSet(viewsets.ModelViewSet):
    serializer_class = LeadSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = Lead.objects.all().prefetch_related('notes')
        
        # Filtering by search query (name, email, phone number)
        q = self.request.query_params.get('q', None)
        if q:
            queryset = queryset.filter(
                Q(name__icontains=q) |
                Q(email__icontains=q) |
                Q(phone_number__icontains=q)
            )
            
        # Filtering by source
        source = self.request.query_params.get('source', None)
        if source:
            queryset = queryset.filter(lead_source=source)
            
        # Filtering by status
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(lead_status=status_param)
            
        # Custom sorting (default is -created_date via model Meta, but we can override)
        ordering = self.request.query_params.get('ordering', None)
        if ordering:
            # Validate ordering fields to prevent SQL injection
            allowed_ordering = ['created_date', '-created_date', 'name', '-name', 'lead_status', '-lead_status']
            if ordering in allowed_ordering:
                queryset = queryset.order_by(ordering)
                
        return queryset

    @action(detail=False, methods=['get'], url_path='export')
    def export_excel(self, request):
        # Apply the same filters as get_queryset, but disable pagination
        queryset = self.get_queryset()
        
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Leads"
        
        # Write headers
        headers = ["Name", "Email", "Phone Number", "Lead Source", "Lead Status", "Created Date"]
        ws.append(headers)
        
        # Write rows
        for lead in queryset:
            ws.append([
                lead.name,
                lead.email,
                lead.phone_number,
                lead.get_lead_source_display(),
                lead.get_lead_status_display(),
                lead.created_date.strftime("%Y-%m-%d %H:%M:%S")
            ])
            
        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        response['Content-Disposition'] = 'attachment; filename="leads.xlsx"'
        wb.save(response)
        return response

    @action(detail=False, methods=['post'], url_path='import-csv')
    def import_csv(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No CSV file uploaded."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            decoded_file = file.read().decode('utf-8')
            io_string = io.StringIO(decoded_file)
            reader = csv.reader(io_string)
        except Exception as e:
            return Response({"error": f"Failed to parse CSV file: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        
        header = next(reader, None)
        
        success_count = 0
        errors = []
        
        for row_idx, row in enumerate(reader, start=2):
            if not row:
                continue
            if len(row) < 3:
                errors.append(f"Row {row_idx}: Row must have at least Name, Email, and Phone Number.")
                continue
            
            name = row[0].strip()
            email = row[1].strip()
            phone = row[2].strip()
            
            source = 'organic'
            if len(row) > 3 and row[3].strip().lower() in ['facebook', 'google', 'organic']:
                source = row[3].strip().lower()
                
            status_val = 'new'
            if len(row) > 4 and row[4].strip().lower() in ['new', 'contacted', 'qualified', 'closed']:
                status_val = row[4].strip().lower()
                
            data = {
                "name": name,
                "email": email,
                "phone_number": phone,
                "lead_source": source,
                "lead_status": status_val
            }
            
            # If lead already exists, update it, otherwise create new
            lead_instance = Lead.objects.filter(email=email).first()
            if lead_instance:
                serializer = LeadSerializer(lead_instance, data=data)
            else:
                serializer = LeadSerializer(data=data)
                
            if serializer.is_valid():
                serializer.save()
                success_count += 1
            else:
                err_msg = ", ".join([f"{k}: {v[0]}" for k, v in serializer.errors.items()])
                errors.append(f"Row {row_idx} ({email or 'No Email'}): {err_msg}")
                
        return Response({
            "success_count": success_count,
            "errors": errors
        }, status=status.HTTP_200_OK)

class LeadNoteViewSet(viewsets.ModelViewSet):
    queryset = LeadNote.objects.all()
    serializer_class = LeadNoteSerializer

class DashboardStatsView(APIView):
    def get(self, request):
        total_leads = Lead.objects.count()
        
        # Today's lead count
        today = timezone.localtime(timezone.now()).date()
        today_leads = Lead.objects.filter(created_date__date=today).count()
        
        # Distribution by source
        source_counts = Lead.objects.values('lead_source').annotate(count=Count('id'))
        source_data = {
            'facebook': 0,
            'google': 0,
            'organic': 0
        }
        for item in source_counts:
            source_data[item['lead_source']] = item['count']
            
        # Summary by status
        status_counts = Lead.objects.values('lead_status').annotate(count=Count('id'))
        status_data = {
            'new': 0,
            'contacted': 0,
            'qualified': 0,
            'closed': 0
        }
        for item in status_counts:
            status_data[item['lead_status']] = item['count']
            
        return Response({
            'total_leads': total_leads,
            'today_leads': today_leads,
            'source_distribution': source_data,
            'status_summary': status_data
        }, status=status.HTTP_200_OK)

from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def get(self, request):
        return Response({
            "username": request.user.username,
            "email": request.user.email,
            "is_superuser": request.user.is_superuser
        })

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def post(self, request):
        try:
            request.user.auth_token.delete()
            return Response({"success": "Successfully logged out."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": "Failed to logout or no token found."}, status=status.HTTP_400_BAD_REQUEST)

