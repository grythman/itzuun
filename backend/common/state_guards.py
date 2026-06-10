"""State transition guards for core transactional entities."""

from common.exceptions import DomainError

ALLOWED_PROJECT_TRANSITIONS = {
    "open": {"reviewing", "closed_refunded"},
    "reviewing": {"agreed", "closed_refunded"},
    "agreed": {"paid", "closed_refunded"},
    "paid": {"in_progress"},
    "in_progress": {"delivered", "disputed"},
    "delivered": {"awaiting_client_review", "completed", "disputed"},
    "awaiting_client_review": {"completed", "disputed"},
    "disputed": {"completed", "closed_refunded"},
    "completed": set(),
    "closed_refunded": set(),
}

ALLOWED_ESCROW_TRANSITIONS = {
    "created": {"held", "disputed"},
    "pending_admin": {"held", "disputed"},
    "held": {"released", "disputed"},
    "disputed": {"released", "refunded"},
    "released": set(),
    "refunded": set(),
}


def guard_project_transition(current_status: str, next_status: str) -> None:
    allowed = ALLOWED_PROJECT_TRANSITIONS.get(current_status, set())
    if next_status not in allowed:
        raise DomainError(
            f"Invalid project transition: {current_status} -> {next_status}"
        )


def guard_escrow_transition(current_status: str, next_status: str) -> None:
    allowed = ALLOWED_ESCROW_TRANSITIONS.get(current_status, set())
    if next_status not in allowed:
        raise DomainError(
            f"Invalid escrow transition: {current_status} -> {next_status}"
        )
