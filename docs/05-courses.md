# بخش درس‌افزار (Courses)

## مدل دیتابیس: Course
هر درس به یک دانشکده (از طریق Department) و یک استاد متصل است.

## API Routes

### Public (نیاز به احراز هویت ندارد)
| Method | Path | توضیحات |
|---|---|---|
| GET | /api/courses | لیست همه درس‌ها |
| GET | /api/courses/:slug | جزئیات یک درس |
| GET | /api/courses/faculties | دانشکده‌ها با گروه‌ها و درس‌ها |
| GET | /api/courses/departments | گروه‌ها با دانشکده |

### Management (نیاز به نقش SUPER_ADMIN, ADMIN, PROFESSOR)
| Method | Path | توضیحات |
|---|---|---|
| POST | /api/courses/manage | ایجاد درس جدید |
| PUT | /api/courses/manage/:slug | ویرایش درس |
| DELETE | /api/courses/manage/:slug | حذف درس |

### Faculty Management (نیاز به نقش SUPER_ADMIN, ADMIN)
| Method | Path | توضیحات |
|---|---|---|
| POST | /api/faculties | ایجاد دانشکده |
| PUT | /api/faculties/:slug | ویرایش دانشکده |
| DELETE | /api/faculties/:slug | حذف دانشکده |

### Department Management (نیاز به نقش SUPER_ADMIN, ADMIN)
| Method | Path | توضیحات |
|---|---|---|
| POST | /api/departments | ایجاد گروه |
| PUT | /api/departments/:id | ویرایش گروه |
| DELETE | /api/departments/:id | حذف گروه |

## Frontend Pages

| مسیر | توضیحات |
|---|---|
| /dashboard/courses | نمایش درس‌ها به صورت کارت (YouTube-style) |
| /dashboard/courses/[slug] | صفحه جزئیات درس |
| /dashboard/courses/manage | لیست مدیریت دروس |
| /dashboard/courses/manage/[slug] | صفحه ویرایش درس |
| /dashboard/faculties | مدیریت دانشکده‌ها |
| /dashboard/departments | مدیریت گروه‌ها (با فیلتر دانشکده) |
| /dashboard/categories | مدیریت دسته‌بندی‌ها |

## کامپوننت‌ها

### CourseCard
فایل: `apps/web/src/components/CourseCard.jsx`
- نمایش کارت به سبک YouTube: thumbnail, title, description, faculty/department, professor avatar
- hover effect: scale تصویر + play button overlay
- لینک به `/dashboard/courses/:slug`
- انیمیشن با framer-motion
