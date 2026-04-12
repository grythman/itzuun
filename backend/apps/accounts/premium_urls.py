"""Premium API routes."""

from django.urls import re_path

from .views import PremiumCancelView, PremiumMeView, PremiumSubscribeView

urlpatterns = [
    re_path(r"^me/?$", PremiumMeView.as_view(), name="premium-me"),
    re_path(r"^subscribe/?$", PremiumSubscribeView.as_view(), name="premium-subscribe"),
    re_path(r"^cancel/?$", PremiumCancelView.as_view(), name="premium-cancel"),
]
