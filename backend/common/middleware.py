from __future__ import annotations

import uuid

from .request_context import set_request_id


class RequestIdMiddleware:
    """Propagate X-Request-Id for observability and structured logs."""

    header_name = "HTTP_X_REQUEST_ID"
    response_header = "X-Request-Id"

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_id = request.META.get(self.header_name) or str(uuid.uuid4())
        request.request_id = request_id
        set_request_id(request_id)

        response = self.get_response(request)
        response[self.response_header] = request_id
        return response
