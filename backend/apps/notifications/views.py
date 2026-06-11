from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    """Get user notifications"""

    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class NotificationUnreadCountView(APIView):
    """Get unread notification count, optionally filtered by type."""

    def get(self, request):
        qs = Notification.objects.filter(user=request.user, is_read=False)
        ntype = request.query_params.get("type")
        if ntype:
            qs = qs.filter(type=ntype)
        return Response({"count": qs.count()})


class NotificationMarkReadView(APIView):
    """Mark a notification as read"""

    def post(self, request, pk):
        notification = get_object_or_404(Notification, id=pk, user=request.user)
        notification.is_read = True
        notification.save(update_fields=["is_read"])
        return Response({"success": True})


class NotificationMarkAllReadView(APIView):
    """Mark all notifications as read"""

    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(
            is_read=True
        )
        return Response({"success": True})
