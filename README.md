# School Management System

A role-based web app for a school/college where **Teachers** create and grade assignments, **Students** view and submit them, and **Admins** manage users, classes, subjects, and teacher-subject assignments.

## 1. Project Overview

Three roles, one system:

- **Admin** — manages Users, Classes, Subjects, and which Teacher teaches which Subject in which Class. Read-only visibility into every assignment and submission in the system.
- **Teacher** — creates assignments (title, description, deadline, max marks) for a Class + Subject they're assigned to, keeps them as Draft or Publishes them, views submissions, and grades them with marks + feedback.
- **Student** — sees only Published assignments for their own class, submits an answer before the deadline, can edit their submission until it's graded or the deadline passes, and sees their marks/feedback once graded.

All authorization is enforced on the backend (JWT + role checks + ownership checks in the service layer) — the frontend's role-based routing is a UX convenience only, not the security boundary.

## 2. Features

- JWT authentication with hashed passwords (`PasswordHasher<User>`, PBKDF2) and role-based authorization on every API endpoint.
- Self-service registration (`POST /api/auth/register`, and the `/register` page) for all three roles, with auto-login on success — see the security note under Assumptions.
- Full CRUD for Users, Classes, Subjects, and Teacher↔Subject↔Class assignments (Admin).
- Assignment lifecycle: Draft → Published, teacher-owned, scoped to a Class + Subject the teacher is actually assigned to.
- Submission lifecycle: submit → (optionally edit while ungraded and before the deadline) → graded, with marks clamped to `0..maxMarks`.
- Deadline enforcement, ownership enforcement, and duplicate-submission prevention, all server-side.
- Swagger/OpenAPI docs with a working JWT "Authorize" button.
- Responsive UI (mobile/tablet/desktop) with loading, empty, and error states on every data page, and Zod-validated forms with inline error messages.
- 41 backend unit tests covering the business rules above.

## 3. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS, Axios, Zod, React Hook Form |
| Backend | ASP.NET Core Web API (.NET 9), C# |
| Database | PostgreSQL, Entity Framework Core (Npgsql provider) |
| Auth | JWT Bearer tokens, ASP.NET Core `PasswordHasher<T>` |
| API Docs | Swagger / OpenAPI |
| Testing | xUnit + Moq (backend) |

## 4. Architecture — 3-Tier Backend

```
Next.js Frontend  (app/, components/, services/, schemas/)
        |  Axios (JWT Bearer)
        v
ASP.NET Core Web API
        |
  Presentation Layer   SchoolMS.Api        Controllers, Middleware, Program.cs
        v
  Business Logic Layer SchoolMS.Business   Services, Interfaces, DTOs, Exceptions
        v
  Data Access Layer    SchoolMS.Data       DbContext, Repositories, Entities, Migrations
        v
PostgreSQL
```

Controllers depend only on `I*Service` interfaces (never on `AppDbContext` or repositories directly). Services contain all business rules — ownership checks, deadline checks, marks validation — and depend only on `I*Repository` interfaces. Repositories are the only layer that talks to EF Core. `SchoolMS.Tests` tests the Business layer directly against mocked repositories, so tests run without a real database.

## 5. Project Structure

```
Project/
├── README.md, .gitignore, .env.example
├── backend/
│   ├── SchoolMS.sln
│   ├── SchoolMS.Api/        Controllers, Middleware, Program.cs, appsettings*.json
│   ├── SchoolMS.Business/   Services, Interfaces, DTOs, Exceptions, JwtSettings
│   ├── SchoolMS.Data/       AppDbContext, Entities, Enums, Repositories, Configurations, Seed, Migrations
│   └── SchoolMS.Tests/      xUnit + Moq tests for the Business layer
└── frontend/
    ├── app/                 login/, admin/, teacher/, student/ routes (App Router)
    ├── components/          ui/, layout/, forms/
    ├── services/            axiosInstance.ts + one *Service.ts per resource
    ├── schemas/             Zod schemas, one per form
    ├── types/                TypeScript interfaces mirroring backend DTOs
    ├── hooks/               useAuth.ts, useRequireRole.ts
    └── lib/                 jwt.ts (decode/expiry helpers)
```

## 6. Requirements

- .NET 9 SDK
- Node.js 20+ and npm
- PostgreSQL 15+ running locally
- `dotnet-ef` CLI tool: `dotnet tool install --global dotnet-ef` (skip if already installed)

## 7. Database Setup

Create an empty database (adjust the username if yours isn't `postgres`):

```bash
psql -U postgres -c "CREATE DATABASE schoolms;"
```

Then apply the migration (creates all 6 tables) from the `backend/` folder:

```bash
cd backend
dotnet ef database update --project SchoolMS.Data --startup-project SchoolMS.Api
```

You do **not** need to seed data manually — the API automatically runs pending migrations and seeds demo data the first time it starts (see step 8), and it's idempotent (safe to restart any number of times, it only seeds once).

## 8. Backend Setup & Run

```bash
cd backend
dotnet restore
dotnet build
dotnet run --project SchoolMS.Api
```

The API listens on **`http://localhost:5047`**. Swagger UI: `http://localhost:5047/swagger`.

Connection string and JWT settings live in `backend/SchoolMS.Api/appsettings.Development.json` — it already contains working local values (`Host=localhost;Port=5432;Database=schoolms;Username=postgres;Password=1234`). **If your local PostgreSQL password isn't `1234`, edit that file's `ConnectionStrings:DefaultConnection` before running.** See `.env.example` at the project root for what each setting means. `appsettings.json` (the committed "production" config) intentionally only has placeholder values.

## 9. Frontend Setup & Run

In a second terminal, with the backend already running:

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Open `http://localhost:3000`. `frontend/.env.local` already points `NEXT_PUBLIC_API_URL` at `http://localhost:5047/api` — update it if you changed the backend's port.

## 10. Environment Variables

See [`.env.example`](.env.example) at the project root for the full list with descriptions. In short:

- Backend (`appsettings.Development.json`): `ConnectionStrings:DefaultConnection`, `Jwt:Key`, `Jwt:Issuer`, `Jwt:Audience`, `Jwt:ExpiryMinutes`.
- Frontend (`.env.local`): `NEXT_PUBLIC_API_URL`.

## 11. Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@school.com` | `Admin@123` |
| Teacher | `teacher1@school.com` | `Teacher@123` |
| Teacher | `teacher2@school.com` | `Teacher@123` |
| Student | `student1@school.com` (Class 10-A) | `Student@123` |
| Student | `student2@school.com` (Class 9-A) | `Student@123` |
| Student | `student3@school.com` (Class 10-B) | `Student@123` |

Sample data also includes 3 classes, 4 subjects, 4 teacher-subject-class links, 4 assignments (one Draft, three Published), and 3 submissions (one already graded) — enough to exercise every role's screens immediately after setup. You can also create additional accounts yourself via the **Register** link on the login page (`/register`).

## 12. Running Tests

```bash
cd backend
dotnet test
```

41 tests, all passing, covering: login/registration success/failure and JWT claims (`AuthServiceTests`); assignment validation, draft/publish, teacher ownership, and student visibility filtering (`AssignmentServiceTests`); submission deadline/ownership/duplicate rules and marks-bounds grading (`SubmissionServiceTests`); duplicate-email rejection and password hashing (`UserServiceTests`). Tests run against mocked repositories, not a real database, so no extra setup is needed to run them.

There is no separate frontend test suite (out of scope for this project) — the frontend was manually verified end-to-end for all three roles against the live backend (see §14 Known Limitations).

## 13. Assumptions

Documented here because the assignment brief left them open — each is the simplest reasonable choice:

- **Self-registration is open to all three roles, including Admin, with instant activation (no approval step).** The assignment brief itself never mentions registration at all — it only specifies "Login" and says the Admin "manage[s] users," implying admin-provisioned accounts (see the demo credentials table, which the brief expects to already exist). Self-registration was added on top of the base spec at explicit request. Letting anyone register as Admin is a real security tradeoff — in a production school system, Admin accounts should be provisioned by an existing Admin, not self-service — but it's implemented this way here because that's what was asked for. `POST /api/users` (Admin-only user creation) still exists unchanged alongside it.
- Submissions are text-only; there is no file upload.
- Once an assignment's deadline passes, submission and editing are blocked outright — no grace period.
- A submission can only be edited while it is ungraded **and** before the deadline; once a teacher grades it, or the deadline passes, it becomes read-only.
- One submission per student per assignment — "resubmitting" updates the existing row rather than creating a new one.
- A teacher can only create assignments for a Class + Subject combination they're explicitly linked to via a Teacher-Subject-Class assignment (managed by Admin); multiple different teachers may share the same Class + Subject.
- `Class` is a simple flat entity (e.g. "Class 10-A"), not a full course/term catalog.
- Deleting a user is a soft delete (`IsActive = false`) to preserve the history of their assignments/submissions; Classes/Subjects can't be deleted while referenced by a User, Assignment, or Teacher-Subject-Class link.
- Deleting an Assignment cascades to delete its Submissions (only the owning teacher can delete it).
- JWTs expire after 60 minutes; there is no refresh-token flow.
- List endpoints return the full result set (no server-side pagination) — reasonable for the small seeded dataset.
- The frontend stores the JWT in `localStorage`. This is simple but XSS-exposed in a real production app; it's acceptable here because the backend's `[Authorize(Roles=...)]` checks and service-layer ownership checks are the actual security boundary, not the frontend.
- `appsettings.Development.json` is committed (not gitignored) because it only holds a throwaway local dev database password, not a real secret — this keeps the project runnable immediately after cloning. A real deployment would source these values from environment variables or a secret manager instead.

## 14. Known Limitations

- No password-reset or email-verification flow — out of scope for this assignment.
- No file/attachment upload for submissions (text only, by design — see Assumptions).
- No pagination or search/filter UI on list pages beyond what's noted above.
- The frontend was verified manually end-to-end (all three roles, full CRUD + grading + submission flows, responsive layout) rather than with an automated frontend test suite.
- Optional extras from the brief (Docker, live deployment, notifications, advanced filtering) were intentionally not added, per the brief's explicit instruction to keep the implementation simple and avoid over-engineering.
