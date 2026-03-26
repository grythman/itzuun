"""URL configuration for API-first scaffold."""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    
    # --- Accounts / Auth ---
    # Шинэ (Prod): /api/v1/accounts/auth/
    path("api/v1/accounts/auth/", include("apps.accounts.urls")),
    path("api/v1/accounts/users/", include("apps.accounts.urls")),
    # Хуучин (Tests): /api/v1/auth/
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/users/", include("apps.accounts.urls")),

    # --- Profiles ---
    path("api/v1/profiles/", include("apps.profiles.urls")),

    # --- Projects ---
    path("api/v1/projects/", include("apps.projects.urls")),

    # --- Messaging ---
    path("api/v1/messaging/", include("apps.messaging.urls")),

    # --- Payments ---
    path("api/v1/payments/", include("apps.payments.urls")),

    # --- Reviews ---
    path("api/v1/reviews/", include("apps.reviews.urls")),

    # --- Admin Panel ---
    path("api/v1/admin-panel/", include("apps.adminpanel.urls")),
    path("api/v1/admin/", include("apps.adminpanel.urls")), # Тестүүдэд зориулав

    # --- Web / Frontend ---
    path("", include("apps.web.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
