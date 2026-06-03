import { prisma } from "../src/index.js";

const PERMISSIONS = [
  { group: "دروس", permissions: [
    { key: "courses.view", name: "مشاهده دروس", desc: "مشاهده لیست دروس و جزئیات" },
    { key: "courses.create", name: "ایجاد درس", desc: "ایجاد درس جدید" },
    { key: "courses.edit", name: "ویرایش درس", desc: "ویرایش اطلاعات درس" },
    { key: "courses.delete", name: "حذف درس", desc: "حذف درس" },
    { key: "courses.upload", name: "آپلود محتوای درس", desc: "آپلود فایل و ویدیو در درس" },
  ]},
  { group: "کتابخانه", permissions: [
    { key: "books.view", name: "مشاهده کتاب‌ها", desc: "مشاهده لیست کتاب‌ها" },
    { key: "books.create", name: "ایجاد کتاب", desc: "افزودن کتاب جدید" },
    { key: "books.edit", name: "ویرایش کتاب", desc: "ویرایش اطلاعات کتاب" },
    { key: "books.delete", name: "حذف کتاب", desc: "حذف کتاب" },
    { key: "books.upload", name: "آپلود کتاب", desc: "آپلود فایل کتاب" },
  ]},
  { group: "کاربران", permissions: [
    { key: "users.view", name: "مشاهده کاربران", desc: "مشاهده لیست کاربران" },
    { key: "users.create", name: "ایجاد کاربر", desc: "ایجاد حساب کاربری جدید" },
    { key: "users.edit", name: "ویرایش کاربر", desc: "ویرایش اطلاعات کاربران" },
    { key: "users.delete", name: "حذف کاربر", desc: "حذف حساب کاربری" },
    { key: "users.badge", name: "تنظیم بدج", desc: "تنظیم نشان برای کاربران" },
  ]},
  { group: "دانشکده‌ها", permissions: [
    { key: "faculties.view", name: "مشاهده دانشکده‌ها", desc: "مشاهده لیست دانشکده‌ها" },
    { key: "faculties.create", name: "ایجاد دانشکده", desc: "افزودن دانشکده جدید" },
    { key: "faculties.edit", name: "ویرایش دانشکده", desc: "ویرایش اطلاعات دانشکده" },
    { key: "faculties.delete", name: "حذف دانشکده", desc: "حذف دانشکده" },
  ]},
  { group: "گروه‌ها", permissions: [
    { key: "departments.view", name: "مشاهده گروه‌ها", desc: "مشاهده لیست گروه‌ها" },
    { key: "departments.create", name: "ایجاد گروه", desc: "افزودن گروه جدید" },
    { key: "departments.edit", name: "ویرایش گروه", desc: "ویرایش اطلاعات گروه" },
    { key: "departments.delete", name: "حذف گروه", desc: "حذف گروه" },
  ]},
  { group: "دسته‌بندی‌ها", permissions: [
    { key: "categories.view", name: "مشاهده دسته‌بندی‌ها", desc: "مشاهده لیست دسته‌بندی‌ها" },
    { key: "categories.create", name: "ایجاد دسته‌بندی", desc: "افزودن دسته‌بندی جدید" },
    { key: "categories.edit", name: "ویرایش دسته‌بندی", desc: "ویرایش دسته‌بندی" },
    { key: "categories.delete", name: "حذف دسته‌بندی", desc: "حذف دسته‌بندی" },
  ]},
  { group: "اعلامیه‌ها", permissions: [
    { key: "announcements.view", name: "مشاهده اعلامیه‌ها", desc: "مشاهده لیست اعلامیه‌ها" },
    { key: "announcements.create", name: "ایجاد اعلامیه", desc: "ایجاد اعلامیه جدید" },
    { key: "announcements.edit", name: "ویرایش اعلامیه", desc: "ویرایش اعلامیه" },
    { key: "announcements.delete", name: "حذف اعلامیه", desc: "حذف اعلامیه" },
  ]},
  { group: "اعلان‌ها", permissions: [
    { key: "notifications.view", name: "مشاهده اعلان‌ها", desc: "مشاهده اعلان‌ها" },
    { key: "notifications.create", name: "ایجاد اعلان", desc: "ارسال اعلان جدید" },
    { key: "notifications.delete", name: "حذف اعلان", desc: "حذف اعلان" },
  ]},
  { group: "تیکت‌ها", permissions: [
    { key: "tickets.view", name: "مشاهده تیکت‌ها", desc: "مشاهده همه تیکت‌ها" },
    { key: "tickets.manage", name: "مدیریت تیکت‌ها", desc: "پاسخ و بستن تیکت‌ها" },
    { key: "tickets.assign", name: "اختصاص تیکت", desc: "اختصاص تیکت به کاربر" },
    { key: "tickets.delete", name: "حذف تیکت", desc: "حذف تیکت" },
  ]},
  { group: "FTP", permissions: [
    { key: "ftp.view", name: "مرورگر فایل", desc: "مشاهده مرورگر فایل FTP" },
    { key: "ftp.upload", name: "آپلود فایل", desc: "آپلود فایل در FTP" },
    { key: "ftp.delete", name: "حذف فایل", desc: "حذف فایل از FTP" },
    { key: "ftp.rename", name: "تغییر نام", desc: "تغییر نام فایل‌ها و پوشه‌ها" },
    { key: "ftp.settings", name: "تنظیمات FTP", desc: "تنظیمات پوشه‌های منتشر شده و نمایش" },
  ]},
  { group: "تنظیمات", permissions: [
    { key: "settings.roles", name: "مدیریت رول‌ها", desc: "مدیریت رول‌ها و دسترسی‌ها" },
    { key: "settings.team", name: "مدیریت تیم", desc: "مدیریت تیم و اعضا" },
  ]},
];

const ROLE_DEFAULTS = {
  SUPER_ADMIN: PERMISSIONS.flatMap(g => g.permissions.map(p => p.key)),
  ADMIN: [
    "courses.view", "courses.create", "courses.edit", "courses.upload",
    "books.view", "books.create", "books.edit", "books.upload",
    "faculties.view", "faculties.create", "faculties.edit",
    "departments.view", "departments.create", "departments.edit",
    "categories.view", "categories.create", "categories.edit",
    "announcements.view",
    "notifications.view",
    "tickets.view", "tickets.manage", "tickets.assign",
    "settings.team",
  ],
  PROFESSOR: [
    "courses.view", "courses.create", "courses.edit", "courses.upload",
    "books.view", "books.create", "books.edit",
    "announcements.view",
    "tickets.view",
  ],
  STUDENT: [
    "courses.view", "books.view", "announcements.view", "tickets.view",
  ],
};

const ROLE_DEFS = [
  { slug: "SUPER_ADMIN", name: "SUPER_ADMIN", label: "مدیر ارشد", icon: "Shield", color: "text-rose-400", isSystem: true, sortOrder: 0 },
  { slug: "ADMIN", name: "ADMIN", label: "مدیر", icon: "ShieldCheck", color: "text-amber-400", isSystem: true, sortOrder: 1 },
  { slug: "PROFESSOR", name: "PROFESSOR", label: "استاد", icon: "GraduationCap", color: "text-emerald-400", isSystem: true, sortOrder: 2 },
  { slug: "STUDENT", name: "STUDENT", label: "دانشجو", icon: "User", color: "text-sky-400", isSystem: true, sortOrder: 3 },
];

async function seedPermissions() {
  for (const def of ROLE_DEFS) {
    await prisma.roleDefinition.upsert({
      where: { slug: def.slug },
      update: def,
      create: def,
    });
  }

  const created = {};
  for (const group of PERMISSIONS) {
    for (const perm of group.permissions) {
      const p = await prisma.permission.upsert({
        where: { key: perm.key },
        update: { name: perm.name, description: perm.desc, group: group.group },
        create: { key: perm.key, name: perm.name, description: perm.desc, group: group.group },
      });
      created[perm.key] = p;
    }
  }

  for (const [role, keys] of Object.entries(ROLE_DEFAULTS)) {
    for (const key of keys) {
      const perm = created[key];
      if (!perm) continue;
      await prisma.rolePermission.upsert({
        where: { role_permissionId: { role: role, permissionId: perm.id } },
        update: {},
        create: { role: role, permissionId: perm.id },
      });
    }
  }

  console.log("Permissions seeded successfully.");
}

seedPermissions()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
