# Frontend Setup & Structure

Covers the Next.js frontend in `frontend/`: directory layout, how the pieces connect, styling, dependencies, and how to run it. See [BACKEND_SETUP.md](BACKEND_SETUP.md) for the API this talks to, and [FEATURES.md](FEATURES.md) for what each page actually does.

## 1. Directory layout

```
frontend/
├── app/                    Next.js App Router - one folder per route
│   ├── page.tsx             Public landing page (redirects signed-in users to their dashboard)
│   ├── login/, register/, forgot-password/
│   ├── admin/               layout.tsx (role guard) + page.tsx (dashboard) + one folder per admin page
│   │   ├── users/, classes/, subjects/, teacher-assignments/, overview/
│   ├── teacher/
│   │   ├── assignments/     list, new/, [id]/edit/, [id]/submissions/
│   │   └── submissions/[id]/grade/
│   └── student/
│       ├── assignments/[id]/
│       └── submissions/
├── components/
│   ├── ui/                  Generic, reusable primitives: Button, Input, Select, Textarea,
│   │                        DatePicker, Modal, Card, Badge, Spinner, EmptyState, ErrorMessage,
│   │                        SuccessMessage, SearchInput, StatCard, IconButton, IconLink,
│   │                        BackButton, AttachmentLink
│   ├── layout/               Header, Sidebar, DashboardShell (wraps every dashboard page),
│   │                        GlobalSearch, NotificationBell, UpdateProfileModal
│   └── forms/                One form component per resource: LoginForm, RegisterForm,
│                              ForgotPasswordForm, UserForm, ClassForm, SubjectForm,
│                              TeacherAssignmentForm, AssignmentForm, SubmissionForm, GradeForm
├── services/                 axiosInstance.ts + one *Service.ts per resource (thin wrappers
│                              around axios calls, one function per endpoint)
├── schemas/                  One Zod schema per form, paired 1:1 with a component in forms/
├── types/                    TypeScript interfaces mirroring the backend's response DTOs
├── hooks/                    useAuth (auth context/provider), useRequireRole (route guard),
│                              useHighlightRow (scroll-to-and-flash a row from a search result)
├── lib/                      jwt.ts (expiry check), formatDateTime.ts, subjectAbbreviations.ts,
│                              flashHighlight.ts, globalSearch.ts (search data sources + matching)
├── public/                   Static assets (icons, noise.svg used for a gradient dither effect)
├── tailwind.config.ts
└── next.config.ts
```

## 2. How the pieces connect

**Data flow, top to bottom:** a page component (`app/**/page.tsx`) calls a function from `services/*.ts` inside a `useEffect` → the service function calls `axiosInstance` → the response is typed against an interface in `types/` → the page holds it in `useState` and renders it, with `isLoading`/`error` states shown via the shared `Spinner`/`ErrorMessage` components.

**`services/axiosInstance.ts`** is the single Axios instance every service file imports. It:
- Reads `NEXT_PUBLIC_API_URL` as the base URL.
- Attaches `Authorization: Bearer <token>` to every outgoing request via a request interceptor, reading the JWT from `localStorage` (`schoolms_token`).
- On any `401` response, clears `localStorage` and redirects to `/login` (session-expiry handling, centralized in one place).
- Exports `getErrorMessage(error)`, which normalizes ASP.NET's `ProblemDetails` error shape (including field-level validation errors) into a single readable string every form/page uses for its error display.

**Auth state — `hooks/useAuth.tsx`:** a React context provider (`AuthProvider`, mounted once in `app/layout.tsx`) that owns `user`/`token`/`isLoading` and exposes `login`, `register`, `updateProfile`, `logout`. On first mount it restores a session from `localStorage` (falling back to `GET /api/auth/me` if only the token, not the cached user object, is present). Every page that needs to know who's signed in calls `useAuth()`.

**Route protection — `hooks/useRequireRole.ts`:** each of `admin/layout.tsx`, `teacher/layout.tsx`, `student/layout.tsx` calls `useRequireRole("Admin" | "Teacher" | "Student")`, which redirects to `/login` if nobody's signed in, or to the user's *own* dashboard if they're signed in with the wrong role. This is explicitly a UX convenience — the actual access boundary is enforced server-side (see [BACKEND_SETUP.md](BACKEND_SETUP.md) §3).

**Forms — Zod + React Hook Form pairing:** every form component in `components/forms/` pairs with exactly one schema in `schemas/` via `@hookform/resolvers/zod`. Validation runs client-side before submit; server-side validation errors (from ASP.NET's model binding / business rules) are caught and surfaced through `getErrorMessage`.

**Search & row-highlighting:**
- `lib/globalSearch.ts` defines per-role data sources (which service calls to fetch, which fields to match against) and the `searchAll(role, query)` function used by `components/layout/GlobalSearch.tsx` (the header search icon on every dashboard) — live, debounced (300ms), grouped by result type.
- `hooks/useHighlightRow.ts` uses `next/navigation`'s `useSearchParams()` to read a `?highlight=<id>` query param, scroll that row into view, and briefly flash it via `lib/flashHighlight.ts`. Because it needs to react to a query-string-only navigation (searching for something on the page you're already on), every page that calls it is wrapped in a `<Suspense>` boundary, which `useSearchParams()` requires.

## 3. Styling system

Tailwind CSS v3.4, configured in `tailwind.config.ts`:
- **Content scan paths** include `app/`, `components/`, `lib/`, and `hooks/` — the last two were added because `lib/flashHighlight.ts` and the search-highlight logic apply Tailwind classes (`ring-2`, `ring-primary-500`, etc.) dynamically via `classList.add()`, and Tailwind only generates CSS for classes it can find as literal text in a scanned file.
- **Custom color tokens:** `primary` (gold/amber, the brand accent — buttons, active states) and `navy` (deep blue, chrome/headers/footer), each a full 50–900 shade scale, defined in `theme.extend.colors`.
- **Custom box shadows:** `shadow-card` and `shadow-login`.
- Global styles, CSS custom properties, and a couple of shared keyframe animations (`fade-in`, `scale-in`) live in `app/globals.css`.

## 4. Dependencies (what each one is for)

| Package | Purpose |
|---|---|
| `next` / `react` / `react-dom` | Framework and UI runtime |
| `axios` | HTTP client, wrapped once in `services/axiosInstance.ts` |
| `react-hook-form` + `@hookform/resolvers` | Form state and validation wiring |
| `zod` | Schema validation, one schema per form |
| `jwt-decode` | Reading the JWT's expiry claim client-side (`lib/jwt.ts`) without a round-trip |
| `lucide-react` | Icon set used throughout |
| `tailwindcss` / `postcss` / `autoprefixer` | Styling pipeline |
| `eslint` / `eslint-config-next` / `typescript` | Linting and type-checking |

## 5. Running it locally

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

- Requires the backend already running (see [BACKEND_SETUP.md](BACKEND_SETUP.md)).
- `.env.local` needs `NEXT_PUBLIC_API_URL` pointing at the backend's API base (e.g. `http://localhost:5047/api`).
- Opens at `http://localhost:3000`.

Other scripts: `npm run build` (production build), `npm run lint` (ESLint).
