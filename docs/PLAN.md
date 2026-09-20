# School Management System — Project Plan & Status

Single source of truth for what this project is, why it's built the way it is, and what's actually done versus still open. Companion docs: [FRONTEND_SETUP.md](FRONTEND_SETUP.md) (Next.js structure, config, how to run), [BACKEND_SETUP.md](BACKEND_SETUP.md) (3-tier architecture, config, how to run), [FEATURES.md](FEATURES.md) (every feature traced end-to-end), [DATABASE_SCHEMA.svg](DATABASE_SCHEMA.svg) (full entity-relationship diagram).

## 1. What this is

A role-based web app for a school or college. Three roles share one system:

- **Admin** — manages Users, Classes, Subjects, and which Teacher teaches which Subject in which Class. Read-only visibility into every assignment and submission in the system, plus a live search across all of it.
- **Teacher** — creates assignments (title, description, deadline, max marks, optional file attachment) for a Class + Subject they're assigned to, keeps them as Draft or Publishes them, reviews submissions, and grades them with marks + written feedback.
- **Student** — sees only Published assignments for their own class, submits an answer before the deadline, can edit the submission until it's graded or the deadline passes, and sees marks/feedback once graded.

All three roles get in-app notifications for the events relevant to them (new assignment published, submission received, graded, etc.), and a role-scoped global search that finds anything they're allowed to see and jumps straight to it.

## 2. Architecture decisions and why

| Decision | Why |
|---|---|
| **3-tier backend** (`Api` → `Business` → `Data`) | Controllers depend only on service interfaces, never on `AppDbContext` or repositories directly. Business rules (ownership checks, deadline checks, marks bounds) live in one place — the service layer — and are unit-testable against mocked repositories without a real database. |
| **JWT bearer auth, not cookie sessions** | Stateless, works cleanly with a separately-hosted SPA-style frontend, and the token's claims (`role`, `classId` for students) let the backend enforce authorization without an extra DB round-trip per request. |
| **Server-side authorization is the real boundary** | The frontend's role-based routing (`useRequireRole`) is a UX convenience only — every actual permission check (ownership, visibility, deadlines) is re-enforced in the Business layer, because a client-side guard can always be bypassed. |
| **Next.js App Router, client-rendered pages** | Every data-bearing page is `"use client"` with its own `useEffect` fetch — there's no server-side data fetching or SSR of protected data, since everything requires a JWT that only exists in `localStorage`. |
| **PostgreSQL via EF Core / Npgsql** | Relational data with real foreign keys (a submission always belongs to an assignment and a student; a teacher-subject-class link enforces who can create what) — a good fit for EF Core's migration-based schema management. |
| **Self-service registration for all three roles** | Added on top of the original brief, which only specified admin-provisioned accounts. This is a deliberate, documented trade-off: letting anyone self-register as Admin is a real security weakening in a production system, kept here because it's what was asked for. `POST /api/users` (admin-only creation) still exists unchanged alongside it. |
| **Tailwind CSS with custom `navy`/`primary` tokens** | A small, consistent brand palette (deep navy for chrome/headers, gold/amber for primary actions) applied uniformly across the landing page and all three dashboards. |

## 3. Tech stack

| Layer | Technology | Version (confirmed from project files) |
|---|---|---|
| Frontend framework | Next.js (App Router) | 16.3.2 |
| UI library | React | 19.2.8 |
| Language | TypeScript | ^5 |
| Styling | Tailwind CSS | ^3.4.19 |
| HTTP client | Axios | ^1.19.0 |
| Forms | React Hook Form + Zod | ^7.86.0 / ^4.4.3 |
| Icons | lucide-react | ^1.34.0 |
| Backend framework | ASP.NET Core Web API | .NET 9 |
| ORM | Entity Framework Core (Npgsql provider) | 9.0.9 / 9.0.4 |
| Database | PostgreSQL | 15+ |
| Auth | JWT Bearer + `PasswordHasher<T>` (PBKDF2) | — |
| API docs | Swagger / Swashbuckle | 7.2.0 |
| Backend tests | xUnit + Moq | — |

## 4. Current status

**Built and working** (verified by reading the code and, where noted elsewhere in this session, by live testing):
- Full auth flow: register (all 3 roles), login, JWT issuance, OTP-based forgot/reset password (emailed via SMTP), self-service profile update.
- Full CRUD for Users (+ activate/deactivate), Classes, Subjects (+ per-grade curriculum associations), and Teacher↔Subject↔Class assignments.
- Assignment lifecycle: Draft → Published, teacher ownership enforced, optional file attachment (Word/PDF/Excel/image, 10 MB cap), class+subject validated against the actual curriculum.
- Submission lifecycle: submit → edit while ungraded and before deadline → graded, marks clamped to `0..maxMarks`, one submission per student per assignment.
- In-app notifications for: new registration (to admins), assignment published, assignment deadline changed, assignment deleted, submission received, submission resubmitted, submission graded.
- Role-aware global search (live, debounced) across Users/Classes/Subjects/TeacherAssignments/Assignments/Submissions depending on role, with row-highlight-on-navigate.
- Responsive UI with loading/empty/error states, Zod-validated forms, 57 passing backend unit tests.

**Known gaps** (by original design, documented in the code's own comments):
- Submissions are text-only — assignments can have a file attachment, submissions cannot.
- No grace period once a deadline passes.
- No pagination on list endpoints (fine for the current seeded dataset size).
- No refresh-token flow — JWTs simply expire after 60 minutes.
- The `Email` section in `appsettings.Development.json` ships with placeholder `CHANGE_ME` values — forgot-password emails will fail to send until real SMTP credentials are configured (see [BACKEND_SETUP.md](BACKEND_SETUP.md)).

**Schema evolution:** 5 migrations so far — `InitialCreate`, `AddClassGradeSectionAndAssignmentAttachment`, `AddSubjectGrades`, `AddNotifications`, `AddPasswordResetToken` — tracing the order features were actually added (base schema → assignment file attachments → per-grade subject curriculum → in-app notifications → OTP password reset).

**Stale documentation this plan supersedes:** the project's top-level `README.md` still states "No password-reset or email-verification flow" and "No file/attachment upload" under Known Limitations — both are implemented. Treat this `docs/` folder, not the README, as current.
