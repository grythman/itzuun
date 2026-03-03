from django.shortcuts import redirect
from django.views.generic import TemplateView
from rest_framework_simplejwt.authentication import JWTAuthentication


class HomeView(TemplateView):
    template_name = "web/index.html"


class AdminDashboardView(TemplateView):
    template_name = "web/admin.html"

    def get(self, request, *args, **kwargs):
        auth = JWTAuthentication()
        raw_token = request.COOKIES.get("access_token")

        if not raw_token:
            return redirect("/")

        try:
            validated = auth.get_validated_token(raw_token)
            user = auth.get_user(validated)
        except Exception:
            return redirect("/")

        if getattr(user, "role", "") != "admin":
            return redirect("/")

        return super().get(request, *args, **kwargs)
