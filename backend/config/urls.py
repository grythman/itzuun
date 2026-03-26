"""URL configuration for API-first scaffold."""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    # Django Admin
    path("admin/", admin.site.urls),
    
    # Accounts / Auth
    path("api/v1/accounts/auth/", include("apps.accounts.urls")),
    path("api/v1/accounts/users/", include("apps.accounts.urls")),
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/users/", include("apps.accounts.urls")),

    # Зөв хаягууд
    path("api/v1/", include("apps.profiles.urls")),
    path("api/v1/", include("apps.projects.urls")),
    path("api/v1/", include("apps.messaging.urls")),
    path("api/v1/", include("apps.payments.urls")),
    path("api/v1/", include("apps.reviews.urls")),
    
    path("api/v1/admin/", include("apps.adminpanel.urls")),

    # Web (Frontend fallback)
    path("", include("apps.web.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
