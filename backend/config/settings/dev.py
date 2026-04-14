"""
Development settings for the itzuun project.

This file is used when running the development server.
It inherits from the base settings and overrides settings for a local environment.
"""
from .base import *

# --- Debugging ---
DEBUG = True

# --- Database ---
# Use SQLite for simple local development
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# --- Caching ---
# Use in-memory cache for development
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "itzuun-local-cache",
    }
}

# --- Email ---
# Output emails to the console
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# --- Sentry ---
# Set a more specific environment for Sentry
SENTRY_ENVIRONMENT = "development"
