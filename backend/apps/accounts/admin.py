from django.contrib import admin
from django.contrib.auth import get_user_model

User = get_user_model()

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    # Админ хуудсан дээр ямар баганууд харуулахыг зааж өгөх (И-мэйл нь байх нь баталгаатай)
    list_display = ('id', 'email', 'is_active', 'is_staff', 'is_superuser')
    search_fields = ('email',)
    ordering = ('-id',)
