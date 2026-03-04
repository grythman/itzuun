from django.shortcuts import redirect
from django.http import JsonResponse
from django.views.generic import TemplateView
from rest_framework_simplejwt.authentication import JWTAuthentication


class HomeView(TemplateView):
    template_name = "web/index.html"


class AdminDashboardView(TemplateView):
    template_name = "web/admin.html"

    def _expects_json(self, request):
        accept = request.headers.get("Accept", "")
        return "application/json" in accept

    def _unauthorized_response(self, request):
        if self._expects_json(request):
            return JsonResponse({"detail": "Authentication credentials were not provided."}, status=401)
        return redirect("/")

    def _forbidden_response(self, request):
        if self._expects_json(request):
            return JsonResponse({"detail": "You do not have permission to perform this action."}, status=403)
        return redirect("/")

    def get(self, request, *args, **kwargs):
        auth = JWTAuthentication()
        raw_token = request.COOKIES.get("access_token")

        if not raw_token:
            return self._unauthorized_response(request)

        try:
            validated = auth.get_validated_token(raw_token)
            user = auth.get_user(validated)
        except Exception:
            return self._unauthorized_response(request)

        if getattr(user, "role", "") != "admin":
            return self._forbidden_response(request)

        return super().get(request, *args, **kwargs)
