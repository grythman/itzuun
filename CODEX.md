# ITZuun — Codex (Техникийн өдөр тутмын баримт)

Энэ файл нь системийг production-д гарах явцад хийгдсэн бүх засвар,
шийдвэр, одоогийн архитектурын тайлбарыг агуулна.

---

## 1. API клиент — `NEXT_PUBLIC_API_BASE_URL`

**Файл:** `frontend/lib/api/endpoints.ts`

**Асуудал:** `axios.create({ baseURL: "/api/v1" })` гэж hardcode хийсэн байсан.
`NEXT_PUBLIC_API_BASE_URL` env variable унших код байсан ч ашиглагдаагүй байв.

**Засвар:**
```ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";
const apiClient = axios.create({ baseURL: API_BASE_URL, withCredentials: true });
```

**Яагаад чухал вэ?**
- Production-д frontend (`itzuun.works`) болон backend (`api.itzuun.works`) өөр домайн дээр байдаг.
- `/api/v1` relative path нь Next.js rewrite-ийн тусламжтайгаар зөвхөн development-д ажилладаг.
- Production `.env` файлд `NEXT_PUBLIC_API_BASE_URL=https://api.itzuun.works/api/v1` тавих ёстой.

---

## 2. Logo SVG — `unoptimized` prop

**Файл:** `frontend/components/shared/logo.tsx`

**Асуудал:** `<Image src="...logo.svg" />` → `/_next/image?...logo.svg` → **400 Bad Request**

**Шалтгаан:** Next.js image optimizer нь SVG файлыг optimize хийж чадахгүй.

**Засвар:**
```tsx
<Image src={src} alt="ITZuun Logo" ... unoptimized />
```

---

## 3. CI — isort + black + flake8

**Файлууд:** `backend/pyproject.toml`, `backend/.flake8`

### Асуудлын гарал

CI дээр `isort --check .` fail болж байсан. Шалтгаан нь:
- `isort` default `GRID` mode нь `black`-ийн `Vertical Hanging Indent` format-тай зөрчилддөг.
- `pyproject.toml` байхгүй байсан тул isort config уншдаггүй байв.

### Шийдэл

```toml
# backend/pyproject.toml
[tool.isort]
profile = "black"

[tool.black]
line-length = 88
target-version = ["py311"]
```

```ini
# backend/.flake8
[flake8]
max-line-length = 88      # black-тай нийцүүлсэн
extend-ignore = E203, W503, W391
exclude = */migrations/*, .git, __pycache__

per-file-ignores =
    config/settings/*.py: F401, F403, F405  # Django star imports
    */tests/*.py: F841                       # test-д unused variable зөвшөөрнө
    apps/projects/services.py: E402, E501   # late import + AI prompt урт мөр
    manage.py: E501
```

### Хийгдсэн ажил
- 50+ Python файлын import `isort --profile black` ашиглан засагдсан.
- 15 файлаас бодит `F401` unused import-ууд устгагдсан.
- CI workflow-д `Import sorting check (isort)` step нэмэгдсэн.

---

## 4. Google Auth — `google-auth` library

**Файл:** `backend/apps/accounts/services.py`

**Асуудал:** `POST /api/v1/auth/google/` → **500 Internal Server Error**

**Хуучин код (deprecated HTTP endpoint):**
```python
response = requests.get(
    "https://oauth2.googleapis.com/tokeninfo",
    params={"id_token": credential},
)
# audience шалгалт гараар хийгдэж байсан — аюулгүй биш
```

**Шинэ код (Google official library):**
```python
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

payload = id_token.verify_oauth2_token(
    credential,
    google_requests.Request(),
    settings.GOOGLE_CLIENT_ID,
    clock_skew_in_seconds=10,
)
```

**Давуу тал:**
- JWT signature-ийг cryptographic-аар шалгана (HTTP endpoint-г дуудахгүй).
- `aud` claim-ийг автоматаар `GOOGLE_CLIENT_ID`-тай тулгана.
- Google-ийн official, аюулгүй хандлага.

**Нэмсэн package:** `google-auth>=2.0` → `backend/requirements.txt`

**Test файл (`test_google_auth.py`) шинэчлэгдсэн:**
```python
# Хуучин: @patch("apps.accounts.services.requests.get")
# Шинэ:
@patch("google.oauth2.id_token.verify_oauth2_token")
def test_...(self, mock_verify):
    mock_verify.return_value = {"email": "...", "email_verified": True, ...}
```

---

## 5. Notifications migration

**Файлууд:**
- `backend/apps/notifications/migrations/__init__.py`
- `backend/apps/notifications/migrations/0001_initial.py`
- `backend/apps/notifications/models.py`

**Асуудал:** `GET /api/v1/notifications/` → **500 Internal Server Error**
```
relation "notifications_notification" does not exist
```

**Шалтгаан:** `apps.notifications` нь `INSTALLED_APPS`-д бүртгэгдсэн байсан ч
`migrations/` folder байхгүй байсан тул `python manage.py migrate` table үүсгэж чадаагүй.

**Index name pinning — migration drift сэргийлэх:**
```python
# models.py — explicit нэр тавих нь Django version өөрчлөгдөхөд drift гарахгүй болгоно
class Meta:
    indexes = [
        models.Index(
            fields=["user", "-created_at"],
            name="notificatio_user_id_05b4bc_idx",  # explicit, hash биш
        )
    ]
```

Нэр explicit байхгүй бол Django version өөрчлөгдөхөд hash өөр гарч
`0002_rename_...` migration автоматаар үүсдэг → CI migration drift check fail.

---

## 6. Profile 404 засвар + auto-creation signal

**Файлууд:**
- `backend/apps/profiles/signals.py` (шинэ файл)
- `backend/apps/profiles/apps.py`
- `backend/apps/profiles/views.py`

**Асуудал:** `GET /api/v1/profiles/2/` → **404 Not Found** (fresh Supabase database-д)

**Шалтгаан:** Хэрэглэгч бүртгэлтэй болоод Profile row автоматаар үүсдэггүй байв.

### Signal (auto-create on User creation)

```python
# apps/profiles/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        from apps.profiles.models import Profile
        Profile.objects.get_or_create(user=instance)
```

```python
# apps/profiles/apps.py
class ProfilesConfig(AppConfig):
    def ready(self):
        import apps.profiles.signals  # noqa: F401
```

### View — get_or_create (lazy fallback for existing users)

```python
# ProfileDetailView — 404 биш, автоматаар Profile үүсгэнэ
def retrieve(self, request, *args, **kwargs):
    user_id = self.kwargs.get("user_id")
    profile, _ = Profile.objects.get_or_create(user_id=user_id)
    return Response(self.get_serializer(profile).data)
```

---

## 7. Payment endpoint — 404 → 200 `not_created` status

**Файл:** `backend/apps/payments/views.py`

**Асуудал:** `GET /api/v1/payments/project/1/status/` → **404** (payment row байхгүй үед)

**Шийдэл:** Payment row байхгүй үед 404 биш 200 + safe state буцаана:
```python
if not payment:
    return Response({
        "invoice_id": None,
        "status": "not_created",
        "payment": None,
        "verification": {},
    }, status=200)
```

**Payment create 400 — тодорхой error_code:**
```python
return Response({
    "error": "Эхлээд фрилансер сонгоно уу.",
    "error_code": "no_selected_proposal",
}, status=400)
```

**Frontend polling guard** (`payment/page.tsx`):
```ts
// Зөвхөн invoice үүссэний дараа poll хийнэ — 404/spam арилна
const hasActiveInvoice = !!createPaymentMutation.data;

const paymentStatusQuery = useQuery({
    enabled: hasActiveInvoice,
    refetchInterval: (query) => {
        const s = query.state.data?.status;
        if (!s || s === "not_created") return false;  // poll-г зогсооно
        if (s === "paid" || s === "failed") return false;
        return 5000;
    },
});
```

---

## 8. QPay unavailable — User-friendly UI

**Файлууд:**
- `backend/apps/payments/services/qpay_service.py`
- `backend/apps/payments/views.py`
- `frontend/app/[locale]/(public)/projects/[id]/payment/page.tsx`

**Асуудал:** QPay env vars тохируулагдаагүй үед хэрэглэгч харж байсан:
```
"QPay environment configuration is incomplete"
"Unable to fetch payment status"
```

### Backend — machine-readable error code

```python
# qpay_service.py
def is_qpay_configured() -> bool:
    return bool(settings.QPAY_BASE_URL and settings.QPAY_USERNAME and settings.QPAY_PASSWORD)

def authenticate() -> str:
    if not is_qpay_configured():
        if settings.DEBUG:
            return "mock_token"  # Development-д mock ажиллана
        err = DomainError("qpay_unavailable")
        err.error_code = "qpay_unavailable"
        raise err
```

```python
# payments/views.py — HTTP 503 + Монгол мессеж
_QPAY_UNAVAILABLE_RESPONSE = {
    "error_code": "qpay_unavailable",
    "error": "Төлбөрийн систем одоогоор туршилтын горимд байна. "
             "Төлбөрийн мэдээллийг админтай холбогдож авна уу.",
}

try:
    invoice = create_invoice(...)
except DomainError as e:
    if _is_qpay_unavailable_error(e):
        return Response(_QPAY_UNAVAILABLE_RESPONSE, status=503)
    return Response({"error": str(e)}, status=400)
```

### Frontend — ManualPaymentBanner

```tsx
function isQpayUnavailable(error: unknown): boolean {
    const payload = (error as any)?.response?.data;
    return payload?.error_code === "qpay_unavailable"
        || (error as any)?.response?.status === 503;
}

// QPay configured биш үед харагдах banner
function ManualPaymentBanner({ projectId }: { projectId: string }) {
    return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="font-semibold text-amber-900">
                Төлбөрийн систем одоогоор туршилтын горимд байна
            </p>
            <p className="text-sm text-amber-800">
                Төлбөрийн мэдээллийг админтай холбогдож авна уу.
            </p>
            <a href="mailto:support@itzuun.mn">Админтай холбогдох</a>
            <a href="/support">Дэмжлэгийн хуудас</a>
        </div>
    );
}

// QPay UI нь зөвхөн QPay configured үед харагдана
{showManualBanner ? <ManualPaymentBanner /> : <QPay UI ... />}
```

---

## 9. Client/Escrow page (404 засвар)

**Файл:** `frontend/app/[locale]/(dashboard)/client/escrow/page.tsx` (шинэ)

**Асуудал:** Dashboard sidebar дотор `/client/escrow` link байсан ч page файл байхгүй байсан → **404**

**Засвар:** Шинэ page үүсгэсэн — client-ийн идэвхтэй төслүүдийн escrow статус харуулна.
- `RoleGuard` ашиглан зөвхөн `client` role харж чадна.
- `escrowApi.getForProject()` ашиглан escrow мэдээлэл татна.

---

## 10. Deployment architecture

```
itzuun.works (Vercel)          api.itzuun.works (Render)
     │                                  │
  Next.js                          Django + Gunicorn
  frontend/                         backend/
     │                                  │
     └─── HTTPS API calls ─────────────┘
          (NEXT_PUBLIC_API_BASE_URL)
                                        │
                                   Supabase (PostgreSQL)
                                   Redis (cache/sessions)
                                   QPay (payment gateway)
```

### Environment variables

**Frontend (Vercel):**
```env
NEXT_PUBLIC_API_BASE_URL=https://api.itzuun.works/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=931844173573-...
NEXT_PUBLIC_SENTRY_DSN=...
```

**Backend (Render):**
```env
DJANGO_SECRET_KEY=...
DJANGO_DEBUG=0
DJANGO_ALLOWED_HOSTS=api.itzuun.works
DB_NAME=...  DB_USER=...  DB_PASSWORD=...  DB_HOST=...
DB_PORT=5432  DB_SSLMODE=require
REDIS_URL=redis://...
GOOGLE_CLIENT_ID=931844173573-...
GOOGLE_CLIENT_SECRET=...
QPAY_BASE_URL=...   QPAY_USERNAME=...   QPAY_PASSWORD=...
QPAY_MERCHANT_CODE=...   QPAY_CALLBACK_URL=...
DEFAULT_FROM_EMAIL=noreply@itzuun.mn
```

### Start command (Render)
```bash
python manage.py migrate --noinput && gunicorn config.wsgi:application
```

---

## 11. CI/CD pipeline (`.github/workflows/itzuun-ci-vercel-render.yml`)

```
push / PR → main
   │
   ├── workflow-lint
   │    └── actionlint — YAML syntax check
   │
   ├── backend-quality-checks
   │    ├── pip install black flake8 isort pytest psycopg[binary]
   │    ├── isort --check-only .          ← profile=black (pyproject.toml)
   │    ├── black --check .               ← line-length=88
   │    ├── flake8 .                      ← max-line-length=88 (.flake8)
   │    ├── python manage.py check --fail-level WARNING
   │    ├── python manage.py makemigrations --check --dry-run
   │    ├── python manage.py migrate --noinput
   │    ├── KPI smoke tests (bootstrap_pilot_dataset, weekly_kpi_report)
   │    └── python manage.py test
   │
   ├── frontend-quality-checks
   │    ├── npm ci
   │    ├── npm run lint     (ESLint)
   │    ├── npx tsc --noEmit (TypeScript)
   │    ├── npm test         (Vitest)
   │    └── npm run build    (Next.js)
   │
   └── production-ready (main branch only)
        └── Vercel + Render auto-deploy from git integration
```

---

## 12. Django apps overview

| App | Зориулалт |
|-----|-----------|
| `accounts` | User model, Google/OTP auth, JWT cookie session |
| `profiles` | Freelancer/client profile, auto-created via post_save signal |
| `projects` | Project CRUD, proposal, deliverable, AI description suggest |
| `payments` | QPay invoice, escrow lifecycle, dispute |
| `messaging` | Project chat messages |
| `notifications` | In-app notification model (push delivery хийгдээгүй) |
| `reviews` | Project completion review/rating |
| `adminpanel` | Admin dashboard views |
| `common` | Shared exceptions, cache utils, KPI management commands |

---

## 13. Known limitations / TODO

| Зүйл | Тайлбар |
|------|---------|
| QPay credentials | Env vars тохируулагдмагц `ManualPaymentBanner` арилж QPay ажиллана |
| Notification push | `Notification` model бэлэн; WebSocket/webhook push delivery байхгүй |
| Category seeding | `python manage.py load_mn_categories` нэг удаа ажиллуулах хэрэгтэй |
| Email OTP | `DEFAULT_FROM_EMAIL` + SMTP env vars тохируулах хэрэгтэй |
| Sentry | `SENTRY_DSN` env var тохируулах хэрэгтэй |
| AI suggest | `GOOGLE_GENAI_API_KEY` env var шаардлагатай (`projects/services.py`) |
| Verification KYC | Admin panel-д `verify/unsuspend` endpoint бэлэн; ID upload UI байхгүй |



---

## 14. Branch нэгтгэлт + CI алдаа засвар (2026-05-30)

### Асуудлын гарал

Production-д гаргахад **3 хагацсан branch** үлдсэн байсан:

| Branch | Юу агуулж байсан | Статус |
|--------|------------------|--------|
| `main` | Зөвхөн PR #10/#11 (API base URL) | Production |
| `fix/isort-black-formatting` (PR #12) | Lint config + `google-auth` library | Merge хийгдээгүй |
| `hotfix/notifications-migration` (PR #13) | Notifications + profile + payment + QPay UX | Merge хийгдээгүй |

### Гол эрсдэл

`hotfix` branch нь **main-аас** үүссэн (PR #12-аас биш) тул дараах **критик зөрчил** үүссэн:

```python
# apps/accounts/services.py — hotfix branch дээр
from google.oauth2 import id_token   # 👈 ашиглаж байна
```

```text
# requirements.txt — hotfix branch дээр
google-genai             # 👈 google-auth БАЙХГҮЙ!
```

Хэрэв PR #13-ыг merge хийсэн бол production deploy дээр `ImportError: No module
named 'google.oauth2'` алдаа гарч сервер бутрах байсан.

### Засвар

`fix/isort-black-formatting` (PR #12) branch-ийг `hotfix/notifications-migration`
руу `git merge` ашиглан нэгтгэсэн.

**Conflict-уудын шийдэл:**

| Файл | Хувилбар сонгосон | Шалтгаан |
|------|-------------------|----------|
| `notifications/migrations/0001_initial.py` | HEAD (`05b4bc_idx`) | `models.py`-тай таарах explicit нэр |
| `profiles/views.py` | HEAD (`get_or_create` хувилбар) | Auto-create logic шинэ функционал |

**hotfix branch-д нэмэгдсэн зүйлс (PR #12-ээс):**
- ✅ `backend/.flake8` (CI flake8 config)
- ✅ `backend/requirements.txt` → `google-auth>=2.0`
- ✅ `apps/accounts/services.py` → `google.oauth2.id_token.verify_oauth2_token`
- ✅ `apps/accounts/test_google_auth.py` → шинэ mock
- ✅ 50+ файлын isort/black formatting
- ✅ 15 файлаас `F401` unused import цэвэрлэгдсэн

### Зэрэгцээ ажил — GitHub Copilot agent

Хэрэглэгч `@copilot resolve the merge conflicts` гэж бичсэнээс хойш Copilot bot
зэрэгцээ `Merge branch 'main' into hotfix/notifications-migration` (`85ec84a`)
хийсэн. Local merge `d0f0109`-тэй давхцал болсон тул `git pull` нь auto-merge
хийж `4d29ceb` commit үүссэн.

---

## 15. Frontend TypeScript алдаа засвар (PR #13)

CI дээр `tsc --noEmit` step fail болсон. Гарал нь хоёр газраас:

### 15.1 `client/escrow/page.tsx` (шинэ файл)

| Алдаа | Шалтгаан | Засвар |
|-------|----------|--------|
| `useTranslations`, `projectsApi`, `useMe`, `AppCard` unused | Эхний draft-д импорт хийгдсэн ч ашиглагдаагүй | Бүгдийг устгасан |
| `locale` variable unused | Tailgaal зориулж тооцоолсон ч хэрэг болоогүй | Устгасан |
| `<StatusPill status={...} />` | `StatusPill` нь `label` + `tone` авдаг, `status` биш | `<StatusPill label={...} tone={statusTone(...)} />` |
| `project: any` | TS strict mode-д унадаг | `project: ProjectDto` |

### 15.2 `lib/api/types.ts` — `PaymentStatusResponse`

Backend нь Payment row байхгүй үед `{status: "not_created", payment: null,
invoice_id: null}` буцаадаг болсон (Section #7). Гэтэл frontend type нь:

```ts
// Хуучин — narrow
status: "pending" | "paid" | "failed";
payment: PaymentDto;       // null биш гэж тооцсон
invoice_id: string;        // null биш гэж тооцсон
```

→ TypeScript-ийн `not_created` literal болон null утга-уудтай зөрчилдсөн.

```ts
// Шинэ
status: "not_created" | "pending" | "paid" | "failed";
payment: PaymentDto | null;
invoice_id: string | null;
```

---

## 16. Хийгдсэн ажлын товчлол

| # | Категори | Файл/Хэсэг |
|---|----------|------------|
| 1 | API клиент | `frontend/lib/api/endpoints.ts` |
| 2 | Image SVG | `frontend/components/shared/logo.tsx` |
| 3 | CI lint | `backend/pyproject.toml`, `backend/.flake8` |
| 4 | Google Auth | `backend/apps/accounts/services.py`, `requirements.txt` |
| 5 | Notifications | `apps/notifications/migrations/0001_initial.py` |
| 6 | Profile auto-create | `apps/profiles/signals.py`, `apps.py`, `views.py` |
| 7 | Payment 404→200 | `apps/payments/views.py` |
| 8 | QPay UX | `qpay_service.py`, `payment/page.tsx` |
| 9 | Client escrow page | `(dashboard)/client/escrow/page.tsx` |
| 14 | Branch merge | `fix/isort-black-formatting` → `hotfix` |
| 15 | TypeScript fix | `escrow/page.tsx`, `types.ts` |

---

## 17. Production checklist

Merge хийхээс өмнө шалгах:

- [ ] CI green: `actionlint`, `isort`, `black`, `flake8`, Django checks, migration drift, KPI smoke, backend tests, ESLint, `tsc --noEmit`, frontend tests, `next build`
- [ ] Render env: `DJANGO_SECRET_KEY`, DB env vars, `REDIS_URL`, `GOOGLE_CLIENT_ID`/`SECRET`, optional `QPAY_*`, optional `SENTRY_DSN`
- [ ] Vercel env: `NEXT_PUBLIC_API_BASE_URL=https://api.itzuun.works/api/v1`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- [ ] Migration: `python manage.py migrate --noinput` (notifications, payments, profiles, etc.)
- [ ] Smoke test: `/api/v1/auth/me/`, `/api/v1/projects/`, `/api/v1/profiles/me/`, `/api/v1/notifications/`
