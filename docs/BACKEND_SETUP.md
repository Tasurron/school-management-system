# Backend Setup & Structure

Covers the ASP.NET Core backend in `backend/`: the 3-tier architecture, how `Program.cs` wires it together, the data model, configuration, and how to run it. See [FRONTEND_SETUP.md](FRONTEND_SETUP.md) for the client this serves, and [FEATURES.md](FEATURES.md) for the business rules each endpoint enforces.

## 1. Solution structure — 3 tiers, one direction of dependency

```
SchoolMS.sln
├── SchoolMS.Api/        Presentation layer
│   ├── Controllers/      AuthController, UsersController, ClassesController, SubjectsController,
│   │                     TeacherAssignmentsController, AssignmentsController, SubmissionsController,
│   │                     NotificationsController
│   ├── Middleware/        ExceptionHandlingMiddleware (catches Business-layer exceptions,
│   │                      maps them to the right HTTP status + ProblemDetails body)
│   ├── Extensions/        ClaimsPrincipalExtensions (pulls user id/role/classId off the JWT)
│   └── Program.cs         All startup wiring - see §2
├── SchoolMS.Business/    Business logic layer
│   ├── Services/          One class per resource, implements the matching I*Service interface
│   ├── Interfaces/         I*Service contracts that SchoolMS.Api depends on
│   ├── DTOs/               Request/response shapes, one folder per resource
│   ├── Exceptions/         NotFoundException, ForbiddenException, BusinessRuleException,
│   │                       ConflictException, UnauthorizedException - each mapped to a specific
│   │                       HTTP status by the middleware
│   └── Common/             JwtSettings, EmailSettings (bound from appsettings config sections)
├── SchoolMS.Data/        Data access layer
│   ├── AppDbContext.cs     EF Core DbContext - 8 DbSets
│   ├── Entities/            User, Class, Subject, SubjectGrade, TeacherSubjectClass,
│   │                        Assignment, Submission, Notification
│   ├── Enums/                UserRole, AssignmentStatus, SubmissionStatus
│   ├── Configurations/       EF Fluent API config, one class per entity (keys, indexes, FKs,
│   │                         cascade/restrict delete behavior)
│   ├── Repositories/          Interfaces/ + Implementations/, one repository per entity -
│   │                          the *only* layer that talks to AppDbContext directly
│   ├── Migrations/            5 so far, see PLAN.md §4
│   └── Seed/DataSeeder.cs     Idempotent demo data (only seeds if the Users table is empty)
└── SchoolMS.Tests/       xUnit + Moq, tests the Business layer against mocked repositories
```

**The dependency rule that holds the architecture together:** `SchoolMS.Api` depends only on `I*Service` interfaces from `SchoolMS.Business` — never on `AppDbContext` or any repository. `SchoolMS.Business` depends only on `I*Repository` interfaces from `SchoolMS.Data` — never constructs EF queries itself outside a repository. This is what makes `SchoolMS.Tests` able to test every business rule (ownership checks, deadline checks, marks bounds) against mocked repositories, with no real database required.

## 2. `Program.cs` walked through

1. **Configuration binding** — `JwtSettings` and `EmailSettings` are bound from the `Jwt` and `Email` sections of `appsettings*.json` via `IOptions<T>`.
2. **Database** — `AppDbContext` registered with the Npgsql provider, reading `ConnectionStrings:DefaultConnection`.
3. **Dependency injection** — 7 repositories and 9 services registered as `Scoped`, plus `IPasswordHasher<User>` (ASP.NET Core's `PasswordHasher<T>`, PBKDF2 — not the full ASP.NET Core Identity system, just the hasher) as a `Singleton`.
4. **CORS** — a single named policy (`FrontendPolicy`) allowing only `http://localhost:3000`, any header, any method.
5. **Authentication** — JWT Bearer, validating issuer, audience, lifetime, and signing key (HMAC-SHA256) against the configured `Jwt` settings.
6. **Swagger** — registered with a `Bearer` security scheme so the Swagger UI's "Authorize" button accepts a raw token (no `Bearer ` prefix needed).
7. **Request pipeline order**: Swagger → `ExceptionHandlingMiddleware` → HTTPS redirection → CORS → Authentication → Authorization → controller routing.
8. **On startup**: applies any pending EF Core migrations, then runs `DataSeeder.SeedAsync` (safe to restart any number of times — it only seeds once, checking whether the `Users` table is already populated).

## 3. Authorization model

Every endpoint that isn't `login`/`register`/`forgot-password`/`reset-password` requires a valid JWT. Beyond that, authorization happens in two layers:
- **`[Authorize(Roles = "...")]`** on controller actions restricts *which roles* can call an endpoint at all.
- **Ownership/visibility checks inside the service methods** restrict *which rows* a given caller can see or touch — e.g. a Teacher can only fetch/edit/delete assignments where `assignment.TeacherId == currentUserId`; a Student can only ever see `Published` assignments for their own `ClassId`; a Submission can only be fetched by the admin, the owning student, or the owning assignment's teacher.

This second layer is why the frontend's `useRequireRole` route guard (see [FRONTEND_SETUP.md](FRONTEND_SETUP.md) §2) is explicitly documented as a UX convenience only — every actual permission decision is re-checked here, server-side, independent of what the frontend does or doesn't render.

## 4. Data model — 8 entities

Full entity-relationship diagram (every column, type, primary/foreign key, and delete behavior): [DATABASE_SCHEMA.svg](DATABASE_SCHEMA.svg).

| Entity | Purpose | Key relationships |
|---|---|---|
| `User` | Admin/Teacher/Student account | `ClassId` (nullable FK to `Class`, set for Students) |
| `Class` | e.g. "Class 10 - Section A" | `Grade` (8–12) + `Section` (A/B) is the actual identity; `Name` is derived |
| `Subject` | e.g. "Mathematics" | Many-to-many with `Class` grades via `SubjectGrade` |
| `SubjectGrade` | Which grades a subject is taught in | Join entity between `Subject` and a grade number |
| `TeacherSubjectClass` | "This teacher teaches this subject to this class" | FKs to `User` (teacher), `Subject`, `Class` — the link that gates whether a teacher can create an assignment for a given class+subject |
| `Assignment` | Title, description, deadline, max marks, status (Draft/Published), optional attachment fields | FKs to `Class`, `Subject`, `Teacher` (a `User`) |
| `Submission` | A student's answer to an assignment | FKs to `Assignment`, `Student` (a `User`); cascade-deletes when its `Assignment` is deleted |
| `Notification` | In-app notification | FK to the recipient `User`, optional link to an `Assignment` |

## 5. Configuration & running it locally

**Requirements:** .NET 9 SDK, PostgreSQL 15+, `dotnet-ef` CLI tool.

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE schoolms;"

# Apply migrations (also happens automatically on API startup, but can be run manually)
cd backend
dotnet ef database update --project SchoolMS.Data --startup-project SchoolMS.Api

# Run
dotnet restore
dotnet build
dotnet run --project SchoolMS.Api
```

Listens on `http://localhost:5047`; Swagger UI at `http://localhost:5047/swagger`.

**Config lives in `backend/SchoolMS.Api/appsettings.Development.json`** (committed, since it only holds a throwaway local dev DB password — see the root [`.env.example`](../.env.example) for what every value means and how to override it via environment variables). Three sections matter:
- `ConnectionStrings:DefaultConnection` — must match your local Postgres credentials.
- `Jwt` — `Key`/`Issuer`/`Audience`/`ExpiryMinutes`. The committed dev key is fine for local use only.
- `Email` — **ships with placeholder `CHANGE_ME` values.** Forgot-password emails (see [FEATURES.md](FEATURES.md) §1) will fail to send until this is filled in with real SMTP credentials (e.g. a Gmail address + an [App Password](https://myaccount.google.com/apppasswords), not the account's normal password).

**Demo accounts** (seeded automatically, idempotently, on first run):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@school.com` | `Admin@123` |
| Teacher | `teacher1@school.com` | `Teacher@123` |
| Teacher | `teacher2@school.com` | `Teacher@123` |
| Student | `student1@school.com` | `Student@123` |
| Student | `student2@school.com` | `Student@123` |
| Student | `student3@school.com` | `Student@123` |

**Tests:** `dotnet test` from `backend/` — 57 tests, run against mocked repositories, no database needed.
