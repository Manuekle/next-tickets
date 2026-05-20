# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Root (Turborepo — runs across all workspaces)
npm run dev          # start all apps in parallel (web :3000, api :4000)
npm run build        # full monorepo build
npm run lint         # ESLint across all packages
npm run typecheck    # tsc --noEmit across all packages
npm run test         # Jest (API only; web has no unit tests)
npm run format       # Prettier on all TS/TSX/JSON/MD files

# API only (cd apps/api)
npm run db:migrate   # prisma migrate dev
npm run db:seed      # ts-node prisma/seed.ts
npm run db:push      # prisma db push (schema sync without migration file)
npm run db:generate  # prisma generate

# Web E2E (cd apps/web)
npm run test:e2e           # Playwright headless
npm run test:e2e:headed    # Playwright headed
npm run test:e2e:report    # show last report

# Target a single Turborepo package
npm run test --filter=@next-tickets/api
```

## Architecture

**Turborepo monorepo** with npm workspaces:
- `apps/web` — Next.js 15 App Router frontend (React 19, Tailwind 4, shadcn/ui)
- `apps/api` — NestJS 11 backend (REST + WebSocket via Socket.IO)
- `packages/shared` — canonical TypeScript types, DTOs, enums shared by both apps
- `packages/config-typescript` / `packages/config-eslint` — shared tooling configs

### API (`apps/api`)

NestJS with 12 feature modules under `src/modules/`: `auth`, `users`, `tickets`, `comments`, `categories`, `uploads`, `analytics`, `sla`, `automations`, `knowledge`, `admin`, `mailer`.

**Global interceptor** — `TransformInterceptor` (`src/common/interceptors/transform.interceptor.ts`) wraps every response as `{ data: T }` or `{ data: T, meta: any }`. Never return bare objects; the interceptor handles wrapping.

**Auth** — Passport JWT with access + refresh token rotation. `JwtAuthGuard` protects routes; `RolesGuard` + `@Roles()` decorator enforce RBAC. Roles from `@prisma/client`: `SUPER_ADMIN`, `ADMIN`, `AGENT`, `CUSTOMER`.

**Database** — Prisma ORM 6 with PostgreSQL. Schema at `apps/api/prisma/schema.prisma`. Seed at `apps/api/prisma/seed.ts`.

**Infra** — Redis for caching/rate-limiting, MinIO (S3-compatible) for file uploads via `@aws-sdk/client-s3`.

### Web (`apps/web`)

Next.js 15 App Router with two route groups:
- `(auth)/` — login, register, forgot-password, reset-password
- `(dashboard)/` — tickets, analytics, sla, automations, knowledge, admin, settings

**Middleware** (`src/middleware.ts`) — checks `auth-storage` cookie. Unauthenticated users hitting non-auth routes → redirect `/about`. Authenticated users hitting auth pages → redirect `/`.

**API client** (`src/lib/api.ts`) — `apiClient<T>(path, options)` handles auth headers, auto-refreshes tokens on 401, and logs out on refresh failure. Always type as `apiClient<{ data: T }>` for single-entity endpoints (matches TransformInterceptor shape).

**State** — Zustand `useAuthStore` (`src/stores/auth-store.ts`) persists tokens + user to `localStorage` and mirrors to `auth-storage` cookie for SSR middleware. React Query (`@tanstack/react-query`) handles server state.

**UI** — shadcn/ui primitives, Hugeicons, Framer Motion, dnd-kit for drag-and-drop.

### Shared Package (`packages/shared`)

Single source of truth for `Role`, `TicketStatus`, `TicketPriority` enums and all DTOs/types used by both web and API. Import as `@next-tickets/shared`.

## Environment

Copy `.env.example` to `.env`. Defaults work with Docker infra (`docker compose -f docker/docker-compose.yml up -d`). Key vars: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `REDIS_URL`, `NEXT_PUBLIC_API_URL`.

## Conventions

- Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- All API responses are wrapped by `TransformInterceptor` — always destructure `.data` on the client
- Access tokens stored in Zustand + localStorage; refresh token also in localStorage; middleware reads `auth-storage` cookie
