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

### A note on the chart

The signups chart is a **single-series column chart on one axis**. The quings
admin dashboard plots daily signups against a cumulative total on two y-scales;
that was deliberately not copied — the alignment between two scales is
arbitrary, so a dual-axis plot implies a correlation the data doesn't contain.

`GET /project` returns bare documents (unlike `/project/published`, it skips the
repository's `attachMentor` step), so mentor names are joined client-side from
the mentors query.

## Known API gaps

These are **backend** limitations found while building this, not bugs in the
console. Each one has working client code already wired up, so they start
functioning as soon as the API side lands.

### 1. There is no admin role — authorization is owner-scoped everywhere

`AuthMiddleware` (`middlewares/authMiddleware.ts`) verifies *any* valid Firebase
ID token. It establishes **who you are**, never **that you're an admin** — a
student's token reaches every endpoint this console uses. `ProtectedRoute` is
therefore authentication only, and deliberately says so in its docblock.

Worse for an admin tool, every write path checks *ownership*:

| Operation | Guard | Admin result |
|---|---|---|
| `PUT /student/:id` | `student_id !== requester_uid` → 401 | ❌ can't edit anyone |
| `PUT /mentor/:id` | `mentor_id !== requester_uid` → 401 | ❌ can't edit anyone |
| `PUT /project/:id` | `created_by_uid !== requester_uid` → 401 | ❌ unless they own it |
| `DELETE /project/:id` | same owner check | ❌ unless they own it |
| `POST /project` | forces `mentor_id = creator_uid` | ⚠️ assigns the admin as mentor |
| `POST /student`, `POST /mentor` | none | ⚠️ creates a record with no Auth user |
| `DELETE /student/:id`, `DELETE /mentor/:id` | none | ✅ works |
| all `GET`s | none | ✅ works |

So today the console is **read + delete**. Editing and creating are not exposed
in the UI, because every form would 401 or write a record that can't be signed
into — a broken button is worse than an absent one.

**Fix:** an `admin` custom claim, a `requireAdmin` middleware, and an
`isAdmin || isOwner` check replacing the bare `!== requester_uid` comparisons.
The service methods here (`StudentService.update`, `ProjectService.create`, …)
are written and typed against that future, so wiring the forms is a UI-only job
once it exists.

### 2. Students and mentors have no `created_at`

`StudentRepository.createOne` / `MentorRepository.createOne` write the payload
as-is. Both services *strip* `created_at` from update patches, but nothing ever
**sets** it — only `project.service.ts:129` stamps one.

Consequence: the signups chart has no data source. Rather than draw a flat
30-day line that reads as "nobody signed up", it detects the missing field and
says so explicitly. The bucketing logic is complete and starts plotting the
moment the API stamps `created_at` on creation.

The Joined column on the Students table shows an em dash for the same reason.

### 3. Fields in the mock that don't exist

The design mock showed per-student **XP** and an **Active / On Track / Needs
Help** status. Neither is on the student model. Status *is* computed by
`GET /project/mentor/:mentor_id/students`, but only per-mentor — there's no
all-students equivalent. Both were left out rather than faked with placeholder
numbers. Clubs were dropped per the brief.

## Verified

`npx tsc --noEmit` clean, `npm run build` succeeds, dev server serves 200.
The pages have **not** been checked in a browser — no Firebase credentials and
no browser automation in this environment — so visual layout and the live data
paths still need a real run against a populated API.
# scholarton-admin
