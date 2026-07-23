# Scholarton Admin

Admin console for Scholarton — tracks **students**, **mentors** and **projects**.

Built to sit alongside the two existing repos in `SCLT/`:

| Repo | Role |
|---|---|
| `Scholarton-Frontend` | student + mentor app (brand palette, project card patterns) |
| `scholartonapi` | Express + Firebase Functions API this console reads from |

## Stack

React 18 · TypeScript · Vite · Tailwind (class-based dark mode) · shadcn/ui
primitives · TanStack Query · Zustand · Axios · Recharts · Firebase Auth.

The palette is the main app's: `#3b82f6` on light, `#0179C8` on dark, over the
`#0F172A` / `#1E293B` / `#334155` surface ramp, in Montserrat.

## Getting started

```bash
npm install
cp .env.example .env    # then fill it in
npm run dev             # http://localhost:5174
```

`.env` needs the API origin plus the **same** Firebase web config as the main
app — the console signs in against the same user pool, so the ID token it sends
is the one `AuthMiddleware` already knows how to verify.

```
VITE_API_URL=https://<region>-<project-id>.cloudfunctions.net/api
VITE_API_KEY=…
VITE_AUTH_DOMAIN=…
VITE_PROJECT_ID=…
VITE_STORAGE_BUCKET=…
VITE_MESSAGING_SENDER_ID=…
VITE_APP_ID=…
```

Scripts: `npm run dev` · `npm run build` · `npm run lint` · `npm run preview`.

## Layout

```
src/
  Api/          axiosInstance (attaches a fresh Firebase ID token), endpoints, error copy
  Config/       firebase.ts
  Context/      AuthContext — onAuthStateChanged session
  Services/     student / mentor / project — thin wrappers over the API
  Store/        useThemeStore (persisted, drives the `.dark` class)
  Types/        mirrors scholartonapi/functions/src/types/models.ts
  Utils/        date normalisation + name helpers
  hooks/        useAdminData (queries), useChartTheme
  layouts/      DashboardLayout — sidebar shell
  components/   AppSidebar, MetricCard, SignupsChart, ProjectCard, …
  pages/        Login, Dashboard, Students, Mentors, Projects, NotFound
```

## Pages

- **Dashboard** — count cards for students / mentors / projects, a 30-day
  student-signups column chart, and the six most recent project cards.
- **Students** — searchable table: avatar, grade, enrolment count, email
  verification, join date, delete.
- **Mentors** — searchable table: title, expertise, owned-project count, email
  verification, delete. Project counts are derived from the cached projects
  query rather than N calls to `/project/mentor/:id`.
- **Projects** — filterable card grid (search + published/draft), each card
  naming the mentor running it.

