from __future__ import annotations

import logging

from .request_context import get_request_id


class RequestIdFilter(logging.Filter):
    """Attach request id to every log record for correlation across services."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = getattr(record, "request_id", get_request_id())
        return True
