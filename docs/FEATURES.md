# Features — How Everything Actually Works

Every feature traced end-to-end: UI → frontend service → backend controller → business service → repository → database, with the actual business rules enforced along the way. See [PLAN.md](PLAN.md) for the high-level status and [BACKEND_SETUP.md](BACKEND_SETUP.md) / [FRONTEND_SETUP.md](FRONTEND_SETUP.md) for the structural background these sections assume.

## 1. Authentication & accounts

**Register** (`/register` → `POST /api/auth/register`, handled by `AuthService.RegisterAsync`) — open to all three roles. Registering as a Student requires an existing `ClassId`; the account is active immediately and a JWT is issued on success (auto-login). Every new registration notifies all active Admins.

**Login** (`/login` → `POST /api/auth/login`) — verifies the password against the stored PBKDF2 hash via `IPasswordHasher<User>`, rejects deactivated accounts (`IsActive == false`), and returns a JWT valid for 60 minutes. The token's claims carry `NameIdentifier` (user id), `Email`, `Name`, `Role`, and — for Students only — `classId`, which is how the backend scopes assignment visibility without an extra query.

**Forgot / reset password** (`/forgot-password` → `POST /api/auth/forgot-password` then `POST /api/auth/reset-password`) — a 6-digit numeric OTP is generated (`RandomNumberGenerator`), stored on the user row with a 10-minute expiry, and emailed via `EmailService` (plain SMTP, `System.Net.Mail`). To avoid leaking which emails are registered, requesting a reset for a non-existent or inactive account silently no-ops rather than erroring. Resetting requires the exact OTP, unexpired, matched to the email.

**Profile update** (header → `UpdateProfileModal.tsx` → `PUT /api/auth/me`) — a signed-in user can change their own full name and, optionally, password. Does not touch email or role.

## 2. Admin: Users, Classes, Subjects, Teacher Assignments

**Users** (`/admin/users`) — full CRUD plus deactivate/reactivate (a soft delete: `IsActive` flips, the row and its history stay). Every create/update/deactivate/reactivate notifies the affected user directly and, separately, every *other* active Admin (the acting Admin is excluded from that second notification so they don't get notified about their own action).

**Classes** (`/admin/classes`) — simple CRUD. A class's real identity is `Grade` (8–12) + `Section` (A/B); `Name` (e.g. "Class 10 - Section A") is derived, not independently editable. Note: a class also gets created automatically, on the fly, the first time a Teacher picks a Grade+Section combination while creating an assignment that doesn't have a `Class` row yet (`AssignmentService.FindOrCreateClassAsync`) — Admin-created classes aren't a hard prerequisite for that flow.

**Subjects** (`/admin/subjects`) — CRUD plus which grades each subject is taught in, via the `SubjectGrade` join entity. This grade association is what `AssignmentService.EnsureSubjectValidForGradeAsync` checks against when a Teacher creates an assignment, so a mismatched subject/grade combination is rejected server-side even if the frontend's dropdown somehow allowed it.

**Teacher ↔ Subject ↔ Class assignments** (`/admin/teacher-assignments`) — the link that determines which Class+Subject combinations a given Teacher is allowed to create assignments for. Multiple teachers can share the same Class+Subject.

**System-wide overview** (`/admin/overview`) — read-only view of every assignment and submission across the whole system, for oversight without touching ownership rules elsewhere.

## 3. Assignment lifecycle (Teacher)

Created via `/teacher/assignments/new` → `POST /api/assignments`, implemented in `AssignmentService.CreateAsync`:
- `MaxMarks` must be `> 0`; `Deadline` must be in the future.
- The Class (Grade+Section) is resolved or auto-created, then the Subject is validated as actually taught at that grade.
- Starts as `Draft` unless explicitly published on create.
- An optional single file attachment: capped at 10 MB, restricted to `.doc/.docx/.pdf/.xls/.xlsx/.jpg/.jpeg/.png/.gif/.webp`, stored on disk under `uploads/assignments/` with a GUID-based filename (the original filename is preserved separately for display/download).
- Publishing (on create or via a later edit that flips Draft → Published) notifies every active Student in the target class. Changing the deadline on an already-published assignment also notifies the class. Deleting an assignment notifies every student who had submitted to it, then cascade-deletes those submissions.

Editing/deleting is restricted to the owning teacher (`assignment.TeacherId == currentTeacherId`) — enforced in the service layer regardless of what the frontend shows.

## 4. Submission & grading

**Submitting** (`Student → /student/assignments/[id]` → `POST /api/submissions`, `SubmissionService.CreateAsync`): the assignment must be `Published`, belong to the student's own class, and not past its deadline. One submission per student per assignment — a second attempt is rejected as a conflict, not silently overwritten (editing is the separate update path below). Notifies the assignment's teacher.

**Editing a submission** (`PUT /api/submissions/{id}`): only the owning student, only while the deadline hasn't passed, and only while the submission is still `Submitted` (not yet `Graded`) — a graded submission becomes read-only. Notifies the teacher again (as a "resubmitted" notification).

**Grading** (`Teacher → /teacher/submissions/[id]/grade` → `PATCH /api/submissions/{id}/grade`, `SubmissionService.GradeAsync`): only the owning assignment's teacher; marks are clamped server-side to `0..assignment.MaxMarks`. Sets status to `Graded` and notifies the student with their score.

## 5. Notifications

Backed by `Notification` (one row per recipient per event) and `NotificationsController`: `GET /api/notifications` (list), `GET /api/notifications/unread-count`, `PATCH /api/notifications/{id}/read`, `PATCH /api/notifications/read-all`. The frontend's `NotificationBell` polls/displays these with a live unread-count badge. Every notification-worthy action across the app (listed in the sections above) fires through the shared `INotificationService.NotifyUsersAsync`, so the event catalogue is consistent no matter which service triggers it: new registration, account created/updated/deactivated/reactivated, assignment published/deadline-changed/deleted, submission received/resubmitted/graded.

## 6. Role-aware global search

The header search icon on every dashboard (`components/layout/GlobalSearch.tsx`) searches live as you type (debounced 300ms, no submit step) via `lib/globalSearch.ts`'s `searchAll(role, query)`. Each role has its own set of data sources:
- **Admin:** Users, Classes, Subjects, Teacher Assignments, Assignments, Submissions — plus every sidebar page label.
- **Teacher:** their own Assignments and Submissions.
- **Student:** their own visible Assignments and Submissions.

Matching is bidirectional substring matching (`lib/globalSearch.ts`'s `textMatches`) so a plural query like "teachers" still matches a singular field value like a user's `role: "Teacher"` — gated to values of 3+ characters so it doesn't trivially match everything against very short fields (like a one-letter class section). Clicking a result navigates to the page that owns it, appending `?highlight=<rowId>`; that page's `useHighlightRow` hook scrolls the matching row into view and briefly flashes it.

The public landing page (`app/page.tsx`) has its own, separate, simpler search — a single search icon that scrolls to and flashes the matching feature/role section on the same static page, unrelated to the dashboard search above.

## 7. Home / landing page

`app/page.tsx` — the public marketing page at `/`. If a JWT is already present and valid, it redirects straight to the signed-in user's dashboard (`/admin`, `/teacher`, or `/student`) rather than showing the marketing content. Otherwise it renders a hero section, a 6-tile feature grid, and a 3-card role breakdown (Admin/Teacher/Student), each tied to the features described above.
