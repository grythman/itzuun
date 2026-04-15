import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases
DB_NAME = env("DB_NAME", default=None)
DB_USER = env("DB_USER", default=None)
DB_PASSWORD = env("DB_PASSWORD", default=None)
DB_HOST = env("DB_HOST", default="db")
DB_PORT = env("DB_PORT", default="5432")
DATABASE_URL = env("DATABASE_URL", default=None)

if DB_NAME and DB_USER and DB_PASSWORD:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": DB_NAME,
            "USER": DB_USER,
            "PASSWORD": DB_PASSWORD,
            "HOST": DB_HOST,
            "PORT": DB_PORT,
            "CONN_MAX_AGE": env.int("DB_CONN_MAX_AGE", 60),
            "CONN_HEALTH_CHECKS": True,
            "OPTIONS": {
                "sslmode": env.str("DB_SSLMODE", "prefer"),
                "application_name": "itzuun-api",
            },
        }
    }
elif DATABASE_URL:
    DATABASES = {
        "default": env.db_url(
            "DATABASE_URL",
            conn_max_age=env.int("DB_CONN_MAX_AGE", 60),
            conn_health_checks=True,
            ssl_require=env.bool("DB_SSL_REQUIRE", default=True),
        )
    }
else:
    raise ImproperlyConfigured("Production settings requires DATABASE_URL or DB_* env vars")

# Caching
REDIS_URL = env("REDIS_URL", default=None)
if REDIS_URL:
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": REDIS_URL,
            "TIMEOUT": env.int("CACHE_DEFAULT_TIMEOUT", 300),
            "KEY_PREFIX": env("CACHE_KEY_PREFIX", "itzuun"),
            "OPTIONS": {
                "CLIENT_CLASS": "django_redis.client.DefaultClient",
                "CONNECTION_POOL_KWARGS": {
                    "max_connections": env.int("REDIS_MAX_CONNECTIONS", 100),
                    "retry_on_timeout": True,
                },
                "IGNORE_EXCEPTIONS": True,
            },
        }
    }
    SESSION_ENGINE = "django.contrib.sessions.backends.cache"
    SESSION_CACHE_ALIAS = "default"
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "itzuun-prod-fallback-cache",
        }
    }


# Security
SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", True)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = env.int("SECURE_HSTS_SECONDS", 31536000)
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Email
EMAIL_BACKEND = env("EMAIL_BACKEND", "django.core.mail.backends.smtp.EmailBackend")
EMAIL_HOST = env("EMAIL_HOST")
EMAIL_PORT = env.int("EMAIL_PORT", 587)
EMAIL_HOST_USER = env("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD")
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", True)
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", "noreply@itzuun.mn")

# Sentry
if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration()],
        environment=SENTRY_ENVIRONMENT,
        traces_sample_rate=SENTRY_TRACES_SAMPLE_RATE,
        send_default_pii=False,
    )
