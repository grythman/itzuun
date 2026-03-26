from django.contrib import admin
from django.apps import apps

# Апп доторх бүх моделийг автоматаар бүртгэх
app_config = apps.get_app_config('reviews')
for model in app_config.get_models():
    try:
        admin.site.register(model)
    except admin.sites.AlreadyRegistered:
        pass
