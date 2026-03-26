from django.urls import include, path

urlpatterns = [
    path("", include("apps.profiles.urls")),
    path("", include("apps.projects.urls")),
    path("", include("apps.messaging.urls")),
    path("", include("apps.payments.urls")),
    path("", include("apps.reviews.urls")),
]
