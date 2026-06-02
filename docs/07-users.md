# بخش کاربران (Users)

## API Routes

### Management (نیاز به نقش SUPER_ADMIN, ADMIN)
| Method | Path | توضیحات |
|---|---|---|
| GET | /api/users | لیست کاربران |
| POST | /api/users | ایجاد کاربر جدید |
| PUT | /api/users/:id | ویرایش کاربر |
| DELETE | /api/users/:id | حذف کاربر |

## Frontend Pages

| مسیر | توضیحات |
|---|---|
| /dashboard/users | لیست کاربران با قابلیت جستجو |
| /dashboard/users/[id] | صفحه پروفایل کاربر |

## User Roles Display
نقش‌ها با رنگ‌های متفاوت و آیکون‌های خاص نمایش داده می‌شوند:
- **SUPER_ADMIN**: آیکون Shield (رز)
- **ADMIN**: آیکون ShieldCheck (طلایی)
- **PROFESSOR**: آیکون GraduationCap (سبز)
- **STUDENT**: آیکون User (آبی)
