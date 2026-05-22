import logging

from django.core.management.base import BaseCommand

from apps.projects.models import Category

logger = logging.getLogger(__name__)

CATEGORIES = [
    {
        "slug": "web",
        "name_mn": "Веб хөгжүүлэлт",
        "name_en": "Web Development",
        "icon": "🌐",
    },
    {"slug": "mobile", "name_mn": "Мобайл апп", "name_en": "Mobile App", "icon": "📱"},
    {
        "slug": "design",
        "name_mn": "Дизайн & UI/UX",
        "name_en": "Design & UI/UX",
        "icon": "🎨",
    },
    {"slug": "marketing", "name_mn": "Маркетинг", "name_en": "Marketing", "icon": "📈"},
    {
        "slug": "seo",
        "name_mn": "SEO & Агуулга",
        "name_en": "SEO & Content",
        "icon": "🔍",
    },
    {
        "slug": "data",
        "name_mn": "Дата шинжилгээ",
        "name_en": "Data Analysis",
        "icon": "📊",
    },
    {
        "slug": "sysadmin",
        "name_mn": "Системийн дэмжлэг",
        "name_en": "System Admin",
        "icon": "⚙️",
    },
    {
        "slug": "cybersec",
        "name_mn": "Кибер аюулгүй байдал",
        "name_en": "Cybersecurity",
        "icon": "🔒",
    },
    {
        "slug": "devops",
        "name_mn": "DevOps & Cloud",
        "name_en": "DevOps & Cloud",
        "icon": "☁️",
    },
    {
        "slug": "media",
        "name_mn": "Видео & Медиа",
        "name_en": "Video & Media",
        "icon": "🎥",
    },
    {
        "slug": "translation",
        "name_mn": "Орчуулга",
        "name_en": "Translation",
        "icon": "📝",
    },
    {
        "slug": "consulting",
        "name_mn": "Бизнес зөвлөх",
        "name_en": "Business Consulting",
        "icon": "💼",
    },
    {
        "slug": "ai",
        "name_mn": "Хиймэл оюун",
        "name_en": "AI & Machine Learning",
        "icon": "🤖",
    },
    {
        "slug": "gamedev",
        "name_mn": "Тоглоом хөгжүүлэлт",
        "name_en": "Game Development",
        "icon": "🎮",
    },
    {
        "slug": "blockchain",
        "name_mn": "Блокчэйн",
        "name_en": "Blockchain",
        "icon": "⛓️",
    },
    {"slug": "qa", "name_mn": "QA & Тест", "name_en": "QA & Testing", "icon": "✅"},
    {
        "slug": "fintech",
        "name_mn": "Санхүүгийн програм",
        "name_en": "Fintech",
        "icon": "💰",
    },
    {
        "slug": "education",
        "name_mn": "Боловсрол & Сургалт",
        "name_en": "Education & Training",
        "icon": "📚",
    },
    {
        "slug": "healthtech",
        "name_mn": "Эрүүл мэнд & Медик",
        "name_en": "Healthtech",
        "icon": "🏥",
    },
    {"slug": "other", "name_mn": "Бусад", "name_en": "Other", "icon": "✨"},
]


class Command(BaseCommand):
    help = "Loads default Mongolian IT categories"

    def handle(self, *args, **options):
        count = 0
        for cat_data in CATEGORIES:
            obj, created = Category.objects.get_or_create(
                slug=cat_data["slug"],
                defaults={
                    "name_mn": cat_data["name_mn"],
                    "name_en": cat_data["name_en"],
                    "icon": cat_data["icon"],
                },
            )
            if created:
                count += 1
                self.stdout.write(
                    self.style.SUCCESS(f"Created category: {obj.name_mn}")
                )
            else:
                self.stdout.write(f"Category already exists: {obj.name_mn}")

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully loaded {count} new categories. Total expected: {len(CATEGORIES)}"
            )
        )
