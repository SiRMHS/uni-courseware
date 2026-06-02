# سیستم احراز هویت (Auth)

## نقش‌های کاربری (Roles)

| نقش | کلید | دسترسی‌ها |
|---|---|---|
| مدیر ارشد | SUPER_ADMIN | دسترسی کامل به همه بخش‌ها |
| مدیر | ADMIN | مدیریت کاربران، دروس، کتابخانه |
| استاد | PROFESSOR | مدیریت دروس و کتابخانه |
| دانشجو | STUDENT | مشاهده محتوا |

## API Routes

| Method | Path | توضیحات |
|---|---|---|
| POST | /api/auth/register | ثبت نام کاربر جدید |
| POST | /api/auth/login | ورود (برمی‌گرداند JWT token) |
| GET | /api/auth/me | اطلاعات کاربر فعلی (نیاز به توکن) |

## Frontend Pages

| مسیر | توضیحات |
|---|---|
| /login | صفحه ورود |
| /register | صفحه ثبت نام |

## Auth Context

کامپوننت `AuthProvider` در `lib/auth-context.jsx`:
- `user`: اطلاعات کاربر لاگین شده
- `loading`: وضعیت لودینگ
- `login({ email, password })`: لاگین
- `register({ name, email, password, role })`: ثبت نام
- `logout()`: خروج

توکن JWT در `localStorage` با کلید `token` ذخیره می‌شود.
