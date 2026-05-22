from django.apps import apps
from django.contrib import admin

# Апп доторх бүх моделийг автоматаар бүртгэх
app_config = apps.get_app_config("messaging")
for model in app_config.get_models():
    try:
        admin.site.register(model)
    except admin.sites.AlreadyRegistered:
        pass
