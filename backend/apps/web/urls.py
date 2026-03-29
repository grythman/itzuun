from django.urls import path

from .views import AdminDashboardView, HomeView, healthz_view

urlpatterns = [
    path("healthz", healthz_view, name="healthz"),
    path("", HomeView.as_view(), name="home"),
    path("dashboard/admin", AdminDashboardView.as_view(), name="admin-dashboard"),
]
