from django.urls import path

from .views import AdminDashboardView, HomeView

urlpatterns = [
    path("", HomeView.as_view(), name="home"),
    path("dashboard/admin", AdminDashboardView.as_view(), name="admin-dashboard"),
]
