from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from .views import LeadViewSet, LeadNoteViewSet, DashboardStatsView, UserProfileView, LogoutView

router = DefaultRouter()
router.register(r'leads', LeadViewSet, basename='lead')
router.register(r'notes', LeadNoteViewSet, basename='note')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('auth/login/', obtain_auth_token, name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/user/', UserProfileView.as_view(), name='user-profile'),
]

