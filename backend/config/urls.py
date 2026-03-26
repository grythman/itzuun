"""URL configuration for API-first scaffold."""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    
    # 1. Accounts апп-ийн замууд (Frontend болон Test аль алинд нь ажиллах уян хатан тохиргоо)
    path("api/v1/accounts/auth/", include("apps.accounts.urls")),
    path("api/v1/accounts/users/", include("apps.accounts.urls")),
    path("api/v1/auth/", include("apps.accounts.urls")),

    # 2. Бусад апп-уудын анхны "ЗӨВ" бүтэц (Энд би prefix давхардуулсан байсныг засав)
    path("api/v1/", include("apps.profiles.urls")),
    path("api/v1/", include("apps.projects.urls")),
    path("api/v1/", include("apps.messaging.urls")),
    path("api/v1/", include("apps.payments.urls")),
    path("api/v1/", include("apps.reviews.urls")),
    path("api/v1/admin/", include("apps.adminpanel.urls")),
    
    # 3. Үндсэн хуудас
    path("", include("apps.web.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
