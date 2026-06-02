# Uni Courseware Monorepo

Educational courseware, library, and dataset platform built as a pure JavaScript monorepo.

## Structure

```
apps/web/          → Next.js 16 (App Router, Tailwind v4, shadcn/ui)
apps/api-server/   → Express 5 (FTP pooling, binary streaming proxy)
packages/database/ → Shared Prisma schema & client
```

## Prerequisites

- Node.js 20+
- PostgreSQL
- FTP server (credentials via env)

## Setup

```bash
cp .env.example .env
# Edit .env with DATABASE_URL, FTP_*, etc.

npm install
npm run db:generate
npm run db:migrate

# Optional: seed from env-driven JSON
# export SEED_MODULES='[...]'
npm run db:seed
```

## Development

```bash
npm run dev
```

- Web: http://localhost:3000
- API: http://localhost:4000
- Explorer: http://localhost:3000/explore/{moduleKey}

## Architecture

All FTP paths, faculty names, and course codes are resolved dynamically from PostgreSQL via `DynamicModule` and `ModuleItem`. No structural metadata is hardcoded in application source.

**Path resolution:**

```
Final Remote Path = module.ftpBaseRoot + item.relativeFtpPath + runtimeSubpath
```

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection |
| `FTP_*` | FTP server credentials |
| `NEXT_PUBLIC_API_URL` | API base for Next.js proxy |
| `NEXT_PUBLIC_DEFAULT_MODULE_KEY` | Default explorer module on home page |
| `SEED_MODULES` | JSON array for database seeding |
