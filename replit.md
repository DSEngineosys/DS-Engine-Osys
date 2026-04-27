# DS Engineosys Workspace

## Overview

DS Engineosys is a full-stack data science platform for business employee and product analysis. It helps DS Engineers monitor employee efficiency, track tasks, and analyze product market performance using ML-based predictions.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/ds-engineosys)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod, drizzle-zod
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Routing**: wouter
- **Charts**: recharts
- **Animation**: framer-motion

## Application Structure

### Two Phases (Flipkart-style)
1. **Employee Analysis Phase** — Analyze employee efficiency across Production, Marketing, HR departments
2. **Product Analysis Phase** — ML-based product ranking and market predictions for Cosmetics A1 category

### Key Features
- Animated splash/intro with logo, "Get Started" button
- Terms & Conditions, Onboarding flow
- Public home page with Register/Login/About/Help nav
- DS Engineer Dashboard with summary stats
- Employee registration, task assignment, performance tracking
- Product ranking, ML predictions, offer recommendations
- Demo login: admin@dsengineosys.com / password123

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Local Run Setup

The "Start application" workflow runs both services:
- API server on port 8080 (`PORT=8080 pnpm --filter @workspace/api-server run dev`)
- Vite frontend on port 5000 (`PORT=5000 BASE_PATH=/ pnpm --filter @workspace/ds-engineosys run dev`)

Vite dev server proxies `/api` → `http://localhost:8080` (configured in `artifacts/ds-engineosys/vite.config.ts`).

## Color Scheme
White, light blue, and light pink — professional, data-science aesthetic

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
