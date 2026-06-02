# نمای کلی پروژه

## UniCourseware — سامانه آموزشی

یک پلتفرم جامع مدیریت محتوای آموزشی، کتابخانه و مجموعه‌داده.

### تکنولوژی‌ها

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui, framer-motion, GSAP
- **Backend**: Express.js 5, Prisma ORM, PostgreSQL
- **Authentication**: JWT (bcryptjs + jsonwebtoken)
- **Language**: JavaScript (ESM modules)
- **Package Manager**: npm workspaces (monorepo)

### ساختار پروژه

```
/
├── apps/
│   ├── web/          # Next.js frontend (port 3000)
│   └── api-server/   # Express.js API (port 4000)
├── packages/
│   └── database/     # Prisma schema + client
├── docs/             # Documentation
└── package.json      # Root workspace config
```

### نحوه اجرا

```bash
# نصب وابستگی‌ها
npm install

# اجرای migration
npm run db:migrate

# سید دیتا
npm run db:seed
node packages/database/prisma/seed-courses.js
node packages/database/prisma/seed-admin.js

# اجرای پروژه
npm run dev
```
