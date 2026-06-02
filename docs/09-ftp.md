# بخش FTP

## معماری

سیستم FTP از کتابخانه `basic-ftp` برای اتصال به سرور FTP استفاده می‌کند.

### فایل‌های مهم

| فایل | توضیحات |
|---|---|
| `apps/api-server/src/services/ftpPool.js` | Pool مدیریت اتصالات FTP |
| `apps/api-server/src/services/ftpOperations.js` | توابع سطح بالا برای عملیات FTP |
| `apps/api-server/src/routes/ftp.js` | API Routes برای مدیریت FTP |

### API Routes

| Method | Path | توضیحات |
|---|---|---|
| GET | /api/ftp/list-remote | لیست فایل‌های یک مسیر FTP (نیاز به توکن) |
| POST | /api/ftp/upload | آپلود فایل (نیاز به توکن) |
| POST | /api/ftp/mkdir | ساخت پوشه (نیاز به توکن) |
| DELETE | /api/ftp/delete | حذف فایل یا پوشه (نیاز به توکن) |
| GET | /api/ftp/file | دانلود فایل (عمومی) |
| GET | /api/ftp/published-folders | لیست پوشه‌های منتشرشده |
| POST | /api/ftp/published-folders | ایجاد پوشه منتشرشده (ادمین) |
| DELETE | /api/ftp/published-folders/:id | حذف پوشه منتشرشده (ادمین) |
| GET | /api/ftp/folder-settings | تنظیمات پوشه |
| POST | /api/ftp/folder-settings | ذخیره تنظیمات پوشه (ادمین) |
| GET | /api/ftp/display-names | نام‌های نمایشی |
| POST | /api/ftp/display-names | ذخیره نام نمایشی (ادمین) |

### مدل‌های دیتابیس

- **PublishedFolder**: نگاشت مسیر سایت به مسیر ریموت FTP
- **FolderSetting**: تنظیمات هر پوشه (مثلاً حالت LMS)
- **DisplayName**: نام‌های نمایشی سفارشی برای فایل‌ها و پوشه‌ها

### Frontend Pages

| مسیر | توضیحات |
|---|---|
| /dashboard/ftp | مرورگر فایل FTP (لیست، آپلود، ساخت پوشه، حذف) |
| /dashboard/ftp/settings | تنظیمات اتصال FTP (فقط نمایشی، خواندن از .env) |
