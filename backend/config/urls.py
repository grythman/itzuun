"""URL configuration for API-first scaffold."""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    
    # Frontend-ийн /api/v1/accounts/auth/register/ замаар орж ирэхэд
    path("api/v1/accounts/auth/", include("apps.accounts.urls")),
    
    # Frontend-ийн /api/v1/accounts/users/me/ замаар орж ирэхэд
    path("api/v1/accounts/users/", include("apps.accounts.urls")),
    
    # Бусад API замууд
    path("api/v1/profiles/", include("apps.profiles.urls")),
    path("api/v1/projects/", include("apps.projects.urls")),
    path("api/v1/messaging/", include("apps.messaging.urls")),
    path("api/v1/payments/", include("apps.payments.urls")),
    path("api/v1/reviews/", include("apps.reviews.urls")),
    path("api/v1/admin-panel/", include("apps.adminpanel.urls")),
    
    # Үндсэн вэб (Catch-all)
    path("", include("apps.web.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
