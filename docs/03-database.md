# مدل‌های دیتابیس (Prisma Schema)

فایل: `packages/database/prisma/schema.prisma`

## Enums

### Role
- `SUPER_ADMIN` — مدیر ارشد
- `ADMIN` — مدیر
- `PROFESSOR` — استاد
- `STUDENT` — دانشجو

### ModuleType
- `FACULTY_COURSE` — محتوای درسی
- `LIBRARY_BOOK` — کتابخانه
- `TECHNICAL_DATASET` — مجموعه داده

## Models

### User
| فیلد | نوع | توضیحات |
|---|---|---|
| id | String (UUID) | کلید اصلی |
| name | String | نام کاربر |
| email | String (unique) | ایمیل |
| password | String | رمز عبور هش شده |
| role | Role (default: STUDENT) | نقش کاربری |
| createdCourses | Course[] | درس‌های ایجاد شده |
| updatedCourses | Course[] | درس‌های بروزرسانی شده |
| createdBooks | Book[] | کتاب‌های ایجاد شده |
| updatedBooks | Book[] | کتاب‌های بروزرسانی شده |

### Faculty (دانشکده)
| فیلد | نوع | توضیحات |
|---|---|---|
| id | String (UUID) | کلید اصلی |
| name | String | نام دانشکده |
| slug | String (unique) | اسلاگ (لاتین) |
| departments | Department[] | گروه‌های دانشکده |
| books | Book[] | کتاب‌های مرتبط |

### Department (گروه)
| فیلد | نوع | توضیحات |
|---|---|---|
| id | String (UUID) | کلید اصلی |
| name | String | نام گروه |
| slug | String | اسلاگ (unique در هر دانشکده) |
| facultyId | String | FK به Faculty |
| courses | Course[] | درس‌های گروه |
| books | Book[] | کتاب‌های مرتبط |

Unique: `[facultyId, slug]`

### Course (درس)
| فیلد | نوع | توضیحات |
|---|---|---|
| id | String (UUID) | کلید اصلی |
| title | String | عنوان درس |
| slug | String (unique) | اسلاگ |
| description | String? | توضیحات |
| thumbnail | String? | URL تصویر |
| professorName | String? | نام استاد |
| departmentId | String | FK به Department |
| createdById | String? | FK به User (ایجادکننده) |
| updatedById | String? | FK به User (بروزرسانی‌کننده) |

### Book (کتاب)
| فیلد | نوع | توضیحات |
|---|---|---|
| id | String (UUID) | کلید اصلی |
| title | String | عنوان کتاب |
| slug | String (unique) | اسلاگ |
| author | String? | نویسنده |
| description | String? | توضیحات |
| image | String? | URL تصویر جلد |
| fileUrl | String? | URL فایل کتاب |
| categoryId | String? | FK به Category |
| facultyId | String? | FK به Faculty |
| departmentId | String? | FK به Department |
| createdById | String? | FK به User |
| updatedById | String? | FK به User |

### Category (دسته‌بندی کتاب)
| فیلد | نوع | توضیحات |
|---|---|---|
| id | String (UUID) | کلید اصلی |
| name | String | نام دسته‌بندی |
| slug | String (unique) | اسلاگ |
| books | Book[] | کتاب‌های این دسته |

### DynamicModule / ModuleItem / FolderConfig
مدل‌های قدیمی برای مدیریت فایل‌های FTP (سیستم explorer).
