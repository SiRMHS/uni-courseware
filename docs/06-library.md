# بخش کتابخانه (Library)

## مدل دیتابیس: Book
کتاب‌ها به یک دسته‌بندی (Category)، دانشکده (Faculty) و گروه (Department) متصل می‌شوند.

## API Routes

### Public
| Method | Path | توضیحات |
|---|---|---|
| GET | /api/books | لیست همه کتاب‌ها |
| GET | /api/books/:slug | جزئیات یک کتاب |
| GET | /api/categories | لیست دسته‌بندی‌ها |

### Management (نیاز به نقش SUPER_ADMIN, ADMIN, PROFESSOR)
| Method | Path | توضیحات |
|---|---|---|
| POST | /api/books/manage | ایجاد کتاب جدید |
| PUT | /api/books/manage/:slug | ویرایش کتاب |
| DELETE | /api/books/manage/:slug | حذف کتاب |

### Category Management (نیاز به نقش SUPER_ADMIN, ADMIN)
| Method | Path | توضیحات |
|---|---|---|
| POST | /api/categories | ایجاد دسته‌بندی |
| PUT | /api/categories/:slug | ویرایش دسته‌بندی |
| DELETE | /api/categories/:slug | حذف دسته‌بندی |

## Frontend Pages

| مسیر | توضیحات |
|---|---|
| /dashboard/library | نمایش کتاب‌ها به صورت کارت |
| /dashboard/library/[slug] | صفحه جزئیات کتاب |
| /dashboard/library/manage | لیست مدیریت کتاب‌ها |
| /dashboard/library/manage/create | صفحه ایجاد کتاب جدید |
| /dashboard/library/manage/[slug] | صفحه ویرایش کتاب |

## Select Cascading (Faculty → Department)
در فرم‌های ایجاد/ویرایش کتاب، ابتدا دانشکده انتخاب می‌شود و سپس گروه‌های مربوط به آن دانشکده در سلکت گروه نمایش داده می‌شود.

## Book Card
- تصویر جلد (یا placeholder)
- عنوان
- نویسنده
- برچسب دسته‌بندی
- دانشکده و گروه
- لینک به صفحه جزئیات
