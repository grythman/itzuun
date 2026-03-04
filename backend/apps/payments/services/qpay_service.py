"""QPay integration service."""
import hashlib
import hmac
import json
import logging
from dataclasses import dataclass

import requests
from django.conf import settings
from django.core.cache import cache

from common.exceptions import DomainError

logger = logging.getLogger(__name__)

TOKEN_CACHE_KEY = "qpay:access_token"
TOKEN_TTL_SECONDS = 3600


@dataclass
class QPayInvoice:
    invoice_id: str
    qr_text: str
    qr_image: str
    invoice_url: str
    raw_response: dict


def _headers(token: str) -> dict:
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }


def _auth_url() -> str:
    return f"{settings.QPAY_BASE_URL.rstrip('/')}/v2/auth/token"


def _invoice_url() -> str:
    return f"{settings.QPAY_BASE_URL.rstrip('/')}/v2/invoice"


def _payment_check_url() -> str:
    return f"{settings.QPAY_BASE_URL.rstrip('/')}/v2/payment/check"


def authenticate() -> str:
    if not settings.QPAY_BASE_URL or not settings.QPAY_USERNAME or not settings.QPAY_PASSWORD:
        raise DomainError("QPay environment configuration is incomplete")

    cached_token = cache.get(TOKEN_CACHE_KEY)
    if cached_token:
        return cached_token

    payload = {
        "username": settings.QPAY_USERNAME,
        "password": settings.QPAY_PASSWORD,
    }
    response = requests.post(_auth_url(), json=payload, timeout=10)
    if response.status_code >= 400:
        raise DomainError("QPay authentication failed")

    data = response.json()
    token = data.get("access_token") or data.get("token")
    if not token:
        raise DomainError("QPay auth response missing access token")

    cache.set(TOKEN_CACHE_KEY, token, timeout=TOKEN_TTL_SECONDS)
    return token


def create_invoice(*, project, amount: int, callback_url: str) -> QPayInvoice:
    if not settings.QPAY_MERCHANT_CODE:
        raise DomainError("QPAY_MERCHANT_CODE is missing")

    token = authenticate()
    payload = {
        "invoice_code": settings.QPAY_MERCHANT_CODE,
        "sender_invoice_no": f"PROJECT-{project.id}",
        "invoice_receiver_code": "terminal",
        "invoice_description": f"Escrow payment for project {project.title}",
        "amount": amount,
        "callback_url": callback_url,
    }
    response = requests.post(_invoice_url(), headers=_headers(token), json=payload, timeout=12)
    if response.status_code >= 400:
        raise DomainError("QPay invoice creation failed")

    data = response.json()
    invoice_id = data.get("invoice_id") or data.get("invoiceId")
    if not invoice_id:
        raise DomainError("QPay invoice response missing invoice_id")

    return QPayInvoice(
        invoice_id=invoice_id,
        qr_text=data.get("qr_text", ""),
        qr_image=data.get("qr_image", ""),
        invoice_url=data.get("invoice_url", ""),
        raw_response=data,
    )


def get_invoice_status(invoice_id: str) -> dict:
    token = authenticate()
    response = requests.post(
        _payment_check_url(),
        headers=_headers(token),
        json={"invoice_id": invoice_id},
        timeout=12,
    )
    if response.status_code >= 400:
        raise DomainError("QPay payment verification failed")
    return response.json()


def verify_webhook(request) -> dict:
    if not settings.QPAY_WEBHOOK_SECRET:
        raise DomainError("QPAY_WEBHOOK_SECRET is missing")

    signature = request.headers.get("X-QPay-Signature", "")
    if not signature:
        logger.warning("QPay webhook missing signature")
        raise DomainError("Missing webhook signature")

    expected_signature = hmac.new(
        settings.QPAY_WEBHOOK_SECRET.encode("utf-8"),
        request.body,
        hashlib.sha256,
    ).hexdigest()

    normalized_sig = signature.replace("sha256=", "")
    if not hmac.compare_digest(normalized_sig, expected_signature):
        logger.warning("QPay webhook signature mismatch")
        raise DomainError("Invalid webhook signature")

    try:
        payload = json.loads(request.body.decode("utf-8")) if request.body else {}
    except json.JSONDecodeError as exc:
        raise DomainError("Invalid webhook payload") from exc

    invoice_id = payload.get("invoice_id") or payload.get("invoiceId")
    if not invoice_id:
        raise DomainError("Webhook payload missing invoice_id")

    verification = get_invoice_status(invoice_id)
    paid_flag = str(verification.get("payment_status") or verification.get("status") or "").lower()
    is_paid = paid_flag in {"paid", "success", "succeeded"}
    paid_amount = int(verification.get("amount") or payload.get("amount") or 0)

    return {
        "invoice_id": invoice_id,
        "is_paid": is_paid,
        "amount": paid_amount,
        "payload": payload,
        "verification": verification,
    }
