"""Common utilities."""
from dataclasses import dataclass


@dataclass
class Money:
    amount: int
    currency: str = "MNT"
