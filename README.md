# Next Tickets 🎫

> Modern SaaS ticket management platform — a Jira + Zendesk + Linear hybrid.
> Built with Next.js 15, NestJS 11, Prisma ORM, PostgreSQL.

<div align="center">

[![Frontend](https://img.shields.io/badge/Frontend-Vercel-black?style=flat&logo=vercel)](https://next-tickets-roan.vercel.app)
[![API](https://img.shields.io/badge/API-HuggingFace-yellow?style=flat&logo=huggingface)](https://manujsx-next-tickets.hf.space)
[![License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/Manuekle/next-tickets/blob/main/LICENSE)
[![Tests](https://img.shields.io/badge/tests-8%20units%20%7C%207%20e2e-brightgreen)](https://github.com/Manuekle/next-tickets)

</div>

<p align="center">
  <img src="https://img.shields.io/badge/build-passing-brightgreen" alt="Build">
  <img src="https://img.shields.io/badge/node-%3E%3D22-blue" alt="Node">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs">
</p>

---

## ✨ Features

- **Ticket Management** — Full CRUD with priorities, statuses, categories, tags
- **Real-time Collaboration** — WebSocket-powered comments, typing indicators, @mentions
- **SLA Engine** — Configurable SLAs with breach detection and compliance metrics
- **Automations** — Rule engine with triggers, conditions, and actions
- **Knowledge Base** — Articles with markdown, categories, search, helpful voting
- **Analytics** — Trends, agent performance, heatmaps, CSV export
- **RBAC** — Super Admin, Admin, Agent, Customer roles with granular permissions
- **Admin Panel** — User management, audit logs, system stats
- **File Uploads** — S3-compatible storage (MinIO)
- **Dark Mode** — Built-in theme switcher with system preference detection

## 🏗️ Architecture

```
next-tickets/
├── apps/
│   ├── web/                     # Next.js 15 (App Router, 22 routes)
│   │   ├── src/app/(auth)/      # Login, register, forgot/reset password
│   │   └── src/app/(dashboard)/ # Tickets, analytics, admin, SLA, etc.
│   └── api/                     # NestJS 11 (12 modules, REST + WebSocket)
│       └── src/modules/         # auth, users, tickets, comments, categories,
│                                # uploads, analytics, sla, automations,
│                                # knowledge, admin, mailer
├── packages/
│   ├── shared/                  # Shared TypeScript types, DTOs, enums
│   ├── config-typescript/       # Shared tsconfig presets
│   └── config-eslint/           # Shared ESLint configuration
├── docker/
│   ├── docker-compose.yml       # PostgreSQL, Redis, MinIO
│   ├── Dockerfile.api           # API production image
│   └── .dockerignore
└── .github/workflows/
    ├── ci.yml                   # Lint, typecheck, test, build
    └── deploy.yml               # Vercel (web) + Docker/VPS (api)
```

### Monorepo Tooling

Powered by **Turborepo** with npm workspaces for efficient build caching, parallel task execution, and dependency management across all packages.

## 🌐 Production Deployments

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | https://next-tickets-roan.vercel.app | ✅ Live |
| **Backend API** | https://manujsx-next-tickets.hf.space | ✅ Live |
| **Database** | Neon PostgreSQL | ✅ Connected |
| **Storage** | Supabase Storage (S3) | ✅ Configured |

> **Login credentials:** `admin@nexttickets.com` / `Admin123!`

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 22
- Docker (for PostgreSQL, Redis, MinIO)
- npm >= 10

### 1. Clone and install

```bash
git clone <repo-url>
cd next-tickets
npm install
```

### 2. Start infrastructure

```bash
docker compose -f docker/docker-compose.yml up -d
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env if needed (defaults work with Docker)
```

### 4. Setup database

```bash
cd apps/api
npx prisma db push
npx prisma db seed
cd ../..
```

### 5. Start development

```bash
npm run dev
```

### 6. Open browser

- **Frontend** — http://localhost:3000
- **API** — http://localhost:4000/api
- **MinIO Console** — http://localhost:9001 (minioadmin / minioadmin)

### Seed Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@nexttickets.com` | `Admin123!` |
| Agent | `agent@nexttickets.com` | `Agent123!` |
| Customer | `customer@nexttickets.com` | `Customer123!` |

### Screenshot

> ![Dashboard](https://placehold.co/800x450/1a1a2e/eaeaea?text=Dashboard+Preview)
> *Dashboard view showing ticket overview, priority breakdown, and recent activity.*

## 📚 API Overview

All endpoints are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

| Module | Base Path | Description |
|--------|-----------|-------------|
| Auth | `/api/auth` | Register, login, refresh, logout, forgot/reset password, verify email |
| Users | `/api/users` | User CRUD (Admin/Agent) |
| Tickets | `/api/tickets` | Ticket CRUD, assign, status transitions |
| Comments | `/api/tickets/:id/comments` | Public & internal comments on tickets |
| Categories | `/api/categories` | Category CRUD |
| Uploads | `/api/uploads` | File upload to S3/MinIO |
| Analytics | `/api/analytics` | Trends, agent performance, heatmaps, CSV export |
| SLA | `/api/sla` | SLA rule CRUD, compliance metrics, breach checking |
| Automations | `/api/automations` | Automation rule CRUD |
| Knowledge | `/api/knowledge` | Knowledge base articles, categories, helpful voting |
| Admin | `/api/admin` | User management, audit logs, system stats |

### WebSocket Events

- `ticket:updated` — Real-time ticket changes
- `comment:created` — New comments on tickets
- `typing:start` / `typing:stop` — Typing indicators

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 15** | React framework with App Router, Server Components, Streaming |
| **NestJS 11** | Backend framework with modular architecture, guards, interceptors |
| **Prisma ORM 6** | Type-safe database client with migrations and seeding |
| **PostgreSQL 17** | Primary database |
| **Redis 7** | Caching, rate limiting, WebSocket pub/sub |
| **Socket.IO** | Real-time bidirectional communication |
| **React Query** | Server state management and caching |
| **Zustand** | Client-side state management |
| **shadcn/ui** | Accessible, themeable component library |
| **Tailwind CSS 4** | Utility-first styling |
| **Zod** | Runtime validation and TypeScript type inference |
| **Passport JWT** | Authentication with access + refresh token rotation |
| **AWS SDK S3** | File uploads to S3-compatible storage (MinIO) |
| **Nodemailer** | Email delivery (password reset, notifications) |
| **Helmet** | HTTP security headers |
| **Turborepo** | Monorepo orchestration with caching |

## 🔐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | API server port | `4000` |
| `API_URL` | Public API URL | `http://localhost:4000` |
| `FRONTEND_URL` | Frontend URL (CORS) | `http://localhost:3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/next_tickets` |
| `JWT_ACCESS_SECRET` | Access token signing secret | `change-me-access-secret` |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | `change-me-refresh-secret` |
| `JWT_ACCESS_EXPIRY` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token TTL | `7d` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `S3_ENDPOINT` | S3-compatible storage endpoint | `http://localhost:9000` |
| `S3_REGION` | S3 region | `us-east-1` |
| `S3_ACCESS_KEY` | S3 access key | `minioadmin` |
| `S3_SECRET_KEY` | S3 secret key | `minioadmin` |
| `S3_BUCKET` | S3 bucket name | `next-tickets` |
| `S3_PUBLIC_URL` | Public URL for uploaded files | `http://localhost:9000/next-tickets` |
| `SMTP_HOST` | SMTP server host | `localhost` |
| `SMTP_PORT` | SMTP server port | `1025` |
| `SMTP_USER` | SMTP username | — |
| `SMTP_PASS` | SMTP password | — |
| `EMAIL_FROM` | From address for outgoing emails | `noreply@nexttickets.com` |
| `THROTTLE_TTL` | Rate limit window (seconds) | `60` |
| `THROTTLE_LIMIT` | Max requests per window | `100` |

## 🐳 Docker

Quick reference for Docker commands.

```bash
# Build and start all services
docker compose -f docker/docker-compose.yml up -d

# Build only the API image
docker build -f docker/Dockerfile.api -t next-tickets-api .

# Run migrations in container
docker exec -it next-tickets-api npx prisma db push
docker exec -it next-tickets-api npx ts-node prisma/seed.ts
```

## 🤗 Deploy Backend on Hugging Face

The backend is deployed on Hugging Face Spaces with Docker:

- **Live API:** https://manujsx-next-tickets.hf.space
- **Space config:** https://huggingface.co/spaces/manujsx/next-tickets

To deploy your own:

1. Create a Space at [huggingface.co/spaces](https://huggingface.co/spaces):
   - **SDK:** Docker
   - **Hardware:** CPU free (upgradeable to GPU if needed)

2. Configure the Space with these **Secrets** (Settings → Repository Secrets):

   | Secret | Example |
   |--------|---------|
   | `DATABASE_URL` | PostgreSQL connection string (Neon, Supabase, etc.) |
   | `JWT_ACCESS_SECRET` | Random 64-char string |
   | `JWT_REFRESH_SECRET` | Random 64-char string |
   | `FRONTEND_URL` | `https://your-app.vercel.app` |
   | `S3_ENDPOINT` | S3-compatible endpoint (optional) |
   | `S3_ACCESS_KEY` | S3 access key (optional) |
   | `S3_SECRET_KEY` | S3 secret key (optional) |
   | `S3_BUCKET` | `next-tickets` |
   | `SMTP_HOST` | SMTP server (optional - disabled if omitted) |

3. Dockerfile HF-ready at `docker/hf.Dockerfile`. Set in Space settings:
   - **Dockerfile path:** `docker/hf.Dockerfile`

4. Update `NEXT_PUBLIC_API_URL` in Vercel:
   ```
   NEXT_PUBLIC_API_URL=https://your-space.hf.space/api
   ```



## 🔄 CI/CD

### CI (`ci.yml`)
Runs on push to `main`/`develop` and PRs to `main`:

- **lint** — ESLint across all packages
- **typecheck** — TypeScript compilation check
- **test** — Jest unit/integration tests with PostgreSQL service
- **build** — Full Turborepo build

### Deploy (`deploy.yml`)
Runs on push to `main`:

- **Web** — Deploys Next.js frontend to Vercel
- **API** — Builds Docker image, copies to VPS, restarts container

## 📊 Testing

```bash
# Unit & integration tests (Jest) — run from project root
npm run test

# Or target specific package
npm run test --filter=@next-tickets/api

# Lint
npm run lint

# Type checking
npm run typecheck
```

### E2E Tests

```bash
cd apps/web
npx playwright install
npm run test:e2e
```

E2E tests cover auth flows, ticket CRUD, dashboard, and admin operations using Playwright.

## 📁 Project Structure

```
next-tickets/
├── apps/
│   ├── web/
│   │   ├── e2e/                   # Playwright end-to-end tests
│   │   └── src/
│   │       ├── app/
│   │       │   ├── (auth)/        # login, register, forgot/reset password
│   │       │   └── (dashboard)/   # tickets, analytics, sla, admin, knowledge
│   │       ├── components/
│   │       │   └── ui/            # shadcn/ui primitives
│   │       └── lib/               # API client, utilities, hooks
│   └── api/
│       ├── prisma/
│       │   ├── schema.prisma      # Database schema
│       │   └── seed.ts            # Seed data
│       └── src/
│           ├── common/            # Guards, interceptors, filters, decorators
│           ├── modules/           # 12 feature modules (auth, tickets, etc.)
│           └── prisma/            # Prisma module
├── packages/
│   ├── shared/src/                # enums.ts, types.ts
│   ├── config-typescript/         # Shared tsconfigs
│   └── config-eslint/             # Shared ESLint configs
├── docker/                        # Dockerfile, compose, configs
└── .github/workflows/             # CI + Deploy pipelines
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` — New feature
- `fix:` — Bug fix
- `refactor:` — Code restructuring
- `docs:` — Documentation
- `test:` — Tests
- `chore:` — Maintenance

### Code Style

- ESLint + Prettier with shared configs across the monorepo
- TypeScript strict mode enabled
- Imports sorted, no unused variables

## 📄 License

MIT — see [LICENSE](LICENSE) for details.
