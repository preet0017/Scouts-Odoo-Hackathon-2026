# TransitOps — Smart Transport Management System

A full-stack fleet and logistics management platform built for the Scouts Odoo Hackathon 2026. TransitOps handles vehicle dispatch, driver management, trip tracking, maintenance workflows, and fuel/expense analytics with role-based access control.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router, TypeScript) |
| Database | Neon DB (serverless PostgreSQL) |
| ORM | Prisma 5.22 |
| Auth | Auth.js v5 (next-auth beta) — JWT sessions |
| UI | Tailwind CSS v4 + shadcn/ui (base-nova) |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Toasts | Sonner |

---

## Features

- **Authentication** — Credentials login, account lockout after 5 failed attempts (15 min lock)
- **Role-Based Access Control** — 5 roles, each sees only their permitted pages and actions
- **Fleet Management** — Full CRUD for vehicles, unique reg number enforcement, status tracking
- **Driver Management** — Driver registry with license expiry highlighting and safety scores
- **Trip Dispatch** — Create → Dispatch → Complete/Cancel workflow with 10 enforced business rules
- **Maintenance** — Log services, auto-set vehicle to In Shop, close to restore Available
- **Fuel & Expenses** — Log fuel fills and trip expenses, auto-calculated operational cost
- **Analytics** — Revenue charts, cost breakdown by vehicle
- **Admin Panel** — Create employee accounts, assign roles, lock/unlock access, one-time credential reveal
- **Settings** — Depot config, dark/light mode toggle (persisted in localStorage)

---

## Business Rules Enforced

1. Vehicle registration number must be unique
2. Retired / In Shop vehicles cannot be dispatched
3. Drivers with expired licenses or Suspended status cannot be assigned
4. Vehicle / Driver already On Trip cannot be re-assigned
5. Cargo weight cannot exceed vehicle max load capacity
6. Dispatching → vehicle + driver status auto-set to **On Trip**
7. Completing → vehicle + driver status auto-set to **Available**
8. Cancelling a dispatched trip → vehicle + driver restored to **Available**
9. Opening maintenance → vehicle auto-set to **In Shop**
10. Closing maintenance → vehicle restored to **Available** (stays Retired if was Retired)

---

## Roles & Access

| Role | Pages |
|---|---|
| **Admin** | Everything + Admin Panel |
| **Fleet Manager** | Dashboard, Fleet, Maintenance, Analytics, Settings |
| **Dispatcher** | Dashboard, Fleet (view), Trips |
| **Safety Officer** | Dashboard, Drivers, Trips (view) |
| **Financial Analyst** | Dashboard, Fleet (view), Fuel & Expenses, Analytics |

---

## Prerequisites

- Node.js 18+
- npm
- A [Neon DB](https://neon.tech) account (free tier works)

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/preet0017/Scouts-Odoo-Hackathon-2026.git
cd Scouts-Odoo-Hackathon-2026/transitops
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file inside `transitops/`:

```env
# Neon DB pooled connection string (get from neon.tech dashboard)
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Auth.js secret — generate with: openssl rand -base64 32
AUTH_SECRET="your-secret-here"

# App URL
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Run database migrations

```bash
npx prisma migrate dev
```

### 5. Seed the database

```bash
npx prisma db seed
```

This creates all test accounts, 8 vehicles, 7 drivers, 13 trips, 8 maintenance logs, 12 fuel logs, and 9 expenses.

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Test Accounts

| Email | Password | Role |
|---|---|---|
| admin@transitops.in | admin123 | Admin |
| fleet@transitops.in | fleet123 | Fleet Manager |
| dispatch@transitops.in | dispatch123 | Dispatcher |
| safety@transitops.in | safety123 | Safety Officer |
| finance@transitops.in | finance123 | Financial Analyst |

---

## Project Structure

```
transitops/
├── prisma/
│   ├── schema.prisma          # 8 models, 7 enums
│   ├── seed.ts                # Mock data seed
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (auth)/login/      # Login page
│   │   ├── (dashboard)/       # All protected pages
│   │   │   ├── dashboard/
│   │   │   ├── fleet/
│   │   │   ├── drivers/
│   │   │   ├── trips/
│   │   │   ├── maintenance/
│   │   │   ├── fuel/
│   │   │   ├── analytics/
│   │   │   ├── settings/
│   │   │   └── admin/
│   │   ├── actions/           # Server Actions (fleet, drivers, trips, maintenance, fuel, settings, admin)
│   │   └── api/auth/          # Auth.js route handler
│   ├── components/
│   │   ├── layout/            # Sidebar, Header
│   │   ├── ui/                # shadcn/ui primitives
│   │   ├── admin/             # Employee table, create dialog
│   │   ├── fleet/             # Fleet client
│   │   ├── drivers/           # Drivers client
│   │   ├── trips/             # Trips client
│   │   ├── maintenance/       # Log table, dialog, close button
│   │   ├── fuel/              # Fuel client
│   │   ├── analytics/         # Revenue + cost charts
│   │   ├── dashboard/         # KPI cards, filters
│   │   ├── settings/          # Settings form, theme toggle
│   │   └── theme-provider.tsx # Dark/light mode context
│   ├── lib/
│   │   ├── prisma.ts          # Singleton Prisma client
│   │   ├── auth.ts            # Auth.js config + cached auth()
│   │   ├── rbac.ts            # can() helper + navByRole
│   │   ├── transitions.ts     # All status transition logic
│   │   └── validators.ts      # Zod schemas
│   └── proxy.ts               # Auth guard (replaces middleware.ts in Next.js 16)
```

---

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npx prisma studio    # Open Prisma DB browser
npx prisma db seed   # Re-seed the database
npx prisma migrate dev --name <name>  # Create a new migration
```

---

## Notes for Teammates

- **Next.js 16** uses `src/proxy.ts` instead of `src/middleware.ts` for auth guards
- **Zod v4** uses `.issues[0]` not `.errors[0]` on `safeParse` errors
- **base-ui `Select`** `onValueChange` returns `string | null` — always handle null
- **base-ui `DialogTrigger`** uses `render={<Button/>}` instead of `asChild`
- After pulling, always run `npx prisma migrate dev` if schema changed
