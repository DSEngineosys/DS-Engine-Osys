# DS-Engine-Osys

A full-stack workspace for DS Engineer operations — featuring Employee Analysis and Product Analysis phases with ML-powered predictions.

## Project Structure

```
DS-Engine-Osys/
├── frontend/          # React (Vite + TailwindCSS v4 + TypeScript)
│   ├── src/           # Components, pages, hooks, lib
│   ├── public/        # Static assets
│   └── package.json
│
├── backend/           # Node.js / Express API server (TypeScript)
│   ├── controllers/   # Business logic (reserved for extraction)
│   ├── routes/        # API route handlers
│   ├── models/        # Database schemas (MongoDB - coming soon)
│   ├── config/        # Environment & DB configuration
│   ├── lib/           # Shared server utilities (logger, etc.)
│   ├── server.ts      # Entry point
│   └── package.json
│
├── shared/            # Shared packages across frontend & backend
│   ├── api-client-react/  # Auto-generated React Query API client
│   ├── api-spec/          # OpenAPI specification (YAML)
│   ├── api-zod/           # Auto-generated Zod validators
│   └── db/                # Database schemas (Drizzle ORM)
│
├── scripts/           # Dev tooling scripts
├── .env               # Environment variables (not committed)
├── .gitignore
├── package.json       # Workspace root
├── pnpm-workspace.yaml
└── README.md
```

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [pnpm](https://pnpm.io/) v8+
- [MongoDB Community](https://www.mongodb.com/try/download/community) (for backend DB)

## Getting Started

### 1. Install dependencies
```bash
pnpm install
```

### 2. Setup environment variables
Create a `.env` file in the root:
```env
PORT=8080
FRONTEND_PORT=3000
DATABASE_URL=mongodb://localhost:27017/ds-engine-osys
SESSION_SECRET=your-secret-here
```

### 3. Run the backend
```bash
pnpm --filter backend dev
```

### 4. Run the frontend
```bash
pnpm --filter frontend dev
```

## Build for Production

```bash
pnpm run build
```

This runs typechecking + builds both `frontend/dist/public/` and `backend/dist/server.mjs`.

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 19, Vite 7, TailwindCSS v4    |
| Backend   | Express 5, Node.js, TypeScript      |
| Database  | MongoDB (Community Edition)         |
| Shared    | Zod, React Query, OpenAPI spec      |
| Tooling   | pnpm workspaces, TypeScript 5.9     |
