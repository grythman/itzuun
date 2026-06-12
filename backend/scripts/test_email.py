from django.conf import settings
settings.EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
settings.EMAIL_HOST = 'smtp.resend.com'
settings.EMAIL_PORT = 465
settings.EMAIL_HOST_USER = 'resend'
settings.EMAIL_HOST_PASSWORD = 're_fJqQZHsB_hf6dMoXEur6Qh5Zcm9LabcKH'
settings.EMAIL_USE_TLS = False
settings.EMAIL_USE_SSL = True
settings.DEFAULT_FROM_EMAIL = 'ITZuun <noreply@itzuun.works>'
from django.core.mail import send_mail
result = send_mail('ITZuun test', 'ITZuun email amjilttai ajillaj baina.', settings.DEFAULT_FROM_EMAIL, ['btuguldur397@gmail.com'])
print('Result:', result)