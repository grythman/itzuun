from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases

DATABASES = {
    "default": env.db("DATABASE_URL", default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}")
}


# Email
# https://docs.djangoproject.com/en/4.2/ref/settings/#email-backend

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"


# Caching
# https://docs.djangoproject.com/en/4.2/ref/settings/#caches

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "itzuun-local-cache",
    }
}
