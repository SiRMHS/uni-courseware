# سایدبار (Sidebar)

فایل: `apps/web/src/app/dashboard/components/Sidebar.jsx`

## ساختار

### منوی اصلی
1. **داشبورد** (`/dashboard`) — آیکون LayoutDashboard
2. **درس‌افزار** (`/dashboard/courses`) — آیکون GraduationCap
3. **کتابخانه** (`/dashboard/library`) — آیکون Library

### بخش مدیریت (فقط برای کاربران با دسترسی: SUPER_ADMIN, ADMIN, PROFESSOR)
به صورت آکاردئونی (Accordion) با سه بخش:

1. **مدیریت درس‌افزار** (پیش‌فرض باز)
   - مدیریت دروس (`/dashboard/courses/manage`)
   - دانشکده‌ها (`/dashboard/faculties`)
   - گروه‌ها (`/dashboard/departments`)
   - دسته‌بندی‌ها (`/dashboard/categories`)

2. **مدیریت کتابخانه**
   - مدیریت کتاب‌ها (`/dashboard/library/manage`)

3. **مدیریت کاربران**
   - کاربران (`/dashboard/users`)

### بخش کاربر (ثابت در انتهای سایدبار)
- نمایش Avatar، نام، ایمیل، نقش
- دکمه خروج (Logout)
- sticky در پایین سایدبار (خارج از ScrollArea)

## کامپوننت‌ها

### `AccordionSection`
کامپوننت داخلی برای بخش‌های تاشو مدیریت. Props: `title`, `icon`, `children`, `defaultOpen`

### `NavItem`
کامپوننت داخلی برای آیتم‌های منوی مدیریت. Props: `href`, `icon`, `children`, `pathname`

### `getInitials(name)`
تابع کمکی برای提取 حروف اول از نام کاربر.
