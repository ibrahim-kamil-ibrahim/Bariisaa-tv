# Bariisaa Tv Admin

React admin panel for the Bariisaa Tv platform. Manages content, users,
subscriptions, payments, themes, and signup configuration served to the Flutter
mobile app.

## Tech Stack

- **UI:** React 18 + Vite 5 + TypeScript
- **Components:** MUI 6 (`@mui/material`, `@mui/icons-material`) + Tailwind CSS 3
- **State:** Zustand 5
- **Data fetching:** TanStack Query 5 + axios
- **Forms:** react-hook-form + zod (`@hookform/resolvers`)
- **Routing:** react-router-dom 6
- **Charts:** recharts
- **Icons:** lucide-react

## Prerequisites

- Node.js 18+
- The backend running on `http://localhost:3000` (the dev server proxies `/api` to it)

## Setup

```bash
cd admin
npm install
cp .env.example .env    # if present; set VITE_API_BASE_URL otherwise
npm run dev             # http://localhost:5173
```

### API proxy

`vite.config.ts` proxies `/api` → `http://localhost:3000`, so the app talks to
the backend on the same origin during development (no CORS).

```ts
server: {
  port: 5173,
  proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: true } },
}
```

`src/services/api.ts` defaults `baseURL` to `/api/v1` (proxied) or honors
`VITE_API_BASE_URL` when set.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server |
| `npm run build` | `tsc -b && vite build` |
| `npm run preview` | Preview the production build |

## Authentication

- **Login:** `src/auth/pages/LoginPage.tsx` → `POST /api/v1/auth/login`.
- **Refresh:** axios response interceptor in `src/services/api.ts` queues 401s,
  calls `/auth/refresh-token` once, and retries the original request (token
  stored in `localStorage` as `naik_admin_token` / `naik_admin_refresh`).
- **Skip login (dev):** the login screen exposes a dev shortcut that sets
  `naik_admin_dev_skip` — **dev-only**, remove before production.

## Pages

- **Dashboard** — `dashboard-v2`
- **Content** — Books (`books`, `BookFormPage`, `BookDetailPage`), Categories,
  Authors, Storytelling, Music, My Doctor, My Captain, Habits, Media manager
- **Commerce** — Subscriptions (`PlansPage`, `CouponsPage`), Payments, Invoices
- **Users & access** — Users, Roles, Audit logs, Global search
- **Configuration** — Themes, Screen themes, Signup fields, CMS pages, Settings
- **Ops** — Reports, Security center, System logs, Backups, AI assistant

Shared components live in `src/components/` (`DataTable`, `StatCard`,
`PageHeader`, `ConfirmDialog`, `StatusChip`, `FileUpload`, `EmptyState`); state
stores in `src/store/` (`authStore`, `uiStore`, `notificationStore`).

## Project Structure

```
admin/
├── src/
│   ├── main.tsx / App.tsx      # entry + routing
│   ├── services/api.ts         # axios instance + refresh interceptor
│   ├── store/                  # Zustand stores
│   ├── components/             # shared UI (Layout, DataTable, …)
│   ├── pages/                  # one folder per feature
│   ├── auth/                   # native auth screens
│   ├── oauth/                  # legacy OAuth (PKCE) screens
│   ├── theme/                  # MUI theme
│   └── types/
└── vite.config.ts
```

## Verification

```bash
npx tsc --noEmit   # 0 errors
npm run build      # production build
```
