from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


# ── Custom Exception Classes ──────────────────────────
class BusinessLogicError(Exception):
    """Exception for business rule violations."""

    code = "BUSINESS_ERROR"
    status = status.HTTP_400_BAD_REQUEST

    def __init__(self, message, code=None):
        self.message = message
        if code:
            self.code = code
        super().__init__(message)


class DomainError(BusinessLogicError):
    """Backward-compatible domain/service exception."""

    code = "DOMAIN_ERROR"


class StateTransitionError(BusinessLogicError):
    """Invalid state transition."""

    code = "INVALID_STATE_TRANSITION"


class InsufficientFundsError(BusinessLogicError):
    """Insufficient funds for a transaction."""

    code = "INSUFFICIENT_FUNDS"
    status = status.HTTP_402_PAYMENT_REQUIRED


# ── DRF Exception Handler ───────────────────────────────────
def custom_exception_handler(exc, context):
    """
    Custom exception handler for DRF.
    - Handles custom BusinessLogicError exceptions.
    - Formats standard DRF exceptions into a consistent structure.
    """
    response = exception_handler(exc, context)

    # Handle our custom BusinessLogicError
    if isinstance(exc, BusinessLogicError):
        return Response(
            {
                "success": False,
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                },
            },
            status=exc.status,
        )

    # Format standard DRF exceptions
    if response is not None:
        response.data = {
            "success": False,
            "error": {
                "code": _map_error_code(exc),
                "message": _extract_message(response.data),
            },
        }
    return response


def _extract_message(data):
    """Extracts the error message from the response data."""
    if isinstance(data, dict):
        if "detail" in data:
            return str(data["detail"])
        # For validation errors, concatenate messages.
        messages = []
        for field, errors in data.items():
            messages.append(f"{field}: {', '.join(map(str, errors))}")
        return ". ".join(messages)
    if isinstance(data, list):
        return ", ".join(map(str, data))
    return str(data)


def _map_error_code(exc) -> str:
    """Maps exception types to consistent error codes."""
    return {
        "AuthenticationFailed": "AUTH_FAILED",
        "NotAuthenticated": "AUTH_REQUIRED",
        "PermissionDenied": "FORBIDDEN",
        "NotFound": "NOT_FOUND",
        "ValidationError": "VALIDATION_ERROR",
        "Throttled": "RATE_LIMITED",
        "ParseError": "BAD_REQUEST",
        "MethodNotAllowed": "METHOD_NOT_ALLOWED",
        "UnsupportedMediaType": "UNSUPPORTED_MEDIA_TYPE",
    }.get(type(exc).__name__, "SERVER_ERROR")
