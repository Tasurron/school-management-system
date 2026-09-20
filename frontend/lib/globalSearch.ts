// Role-aware "search everything" used by the dashboard header's search box.
// Mirrors the landing page's "search this page" idea, but instead of static
// sections it searches every entity the signed-in role is allowed to see.
// All data comes from the existing list endpoints, which the backend already
// scopes per role (teachers only get their own assignments, students only their
// own class/submissions, etc.) - so no extra authorization is needed here.

import { NAV_LINKS } from "@/components/layout/Sidebar";
import * as userService from "@/services/userService";
import * as classService from "@/services/classService";
import * as subjectService from "@/services/subjectService";
import * as teacherAssignmentService from "@/services/teacherAssignmentService";
import * as assignmentService from "@/services/assignmentService";
import * as submissionService from "@/services/submissionService";
import { formatDeadline } from "@/lib/formatDateTime";
import { Role } from "@/types/user";

export interface SearchResult {
  // Heading the result is listed under in the dropdown ("Users", "Assignments"...).
  group: string;
  // Unique within a group - used as the React key.
  id: string | number;
  title: string;
  subtitle?: string;
  // Where clicking the result goes. List pages get a `?highlight=<rowId>` so
  // the target page can scroll to and flash the matching row.
  href: string;
}

// One searchable data source (e.g. "Users" for Admin).
interface SearchSource<T> {
  group: string;
  fetch: () => Promise<T[]>;
  // Which text fields a query is matched against.
  fields: (item: T) => Array<string | number | null | undefined>;
  toResult: (item: T) => Omit<SearchResult, "group">;
}

// Erases the item type so sources for different entities can live in one list.
type AnySource = SearchSource<unknown>;
function source<T>(config: SearchSource<T>): AnySource {
  return config as unknown as AnySource;
}

// Row ids the target pages render so `?highlight=` can find them.
export function rowId(kind: string, id: number): string {
  return `${kind}-${id}`;
}

const adminSources: AnySource[] = [
  source({
    group: "Users",
    fetch: userService.getUsers,
    fields: (u) => [u.fullName, u.email, u.role, u.className],
    toResult: (u) => ({
      id: u.id,
      title: u.fullName,
      subtitle: `${u.role} · ${u.email}`,
      href: `/admin/users?highlight=${rowId("user", u.id)}`,
    }),
  }),
  source({
    group: "Classes",
    fetch: classService.getClasses,
    fields: (c) => [c.name, `grade ${c.grade}`, c.section],
    toResult: (c) => ({
      id: c.id,
      title: c.name,
      subtitle: `Grade ${c.grade}, Section ${c.section}`,
      href: `/admin/classes?highlight=${rowId("class", c.id)}`,
    }),
  }),
  source({
    group: "Subjects",
    fetch: subjectService.getSubjects,
    fields: (s) => [s.name, s.code],
    toResult: (s) => ({
      id: s.id,
      title: s.name,
      subtitle: s.code ? `Code ${s.code}` : undefined,
      href: `/admin/subjects?highlight=${rowId("subject", s.id)}`,
    }),
  }),
  source({
    group: "Teacher Assignments",
    fetch: teacherAssignmentService.getTeacherAssignments,
    fields: (t) => [t.teacherName, t.subjectName, t.className],
    toResult: (t) => ({
      id: t.id,
      title: t.teacherName,
      subtitle: `${t.subjectName} · ${t.className}`,
      href: `/admin/teacher-assignments?highlight=${rowId("teacher-assignment", t.id)}`,
    }),
  }),
  source({
    group: "Assignments",
    fetch: assignmentService.getAssignments,
    fields: (a) => [a.title, a.description, a.subjectName, a.className, a.teacherName, a.status],
    toResult: (a) => ({
      id: a.id,
      title: a.title,
      subtitle: `${a.subjectName} · ${a.className} · ${a.teacherName}`,
      href: `/admin/overview?highlight=${rowId("assignment", a.id)}`,
    }),
  }),
  source({
    group: "Submissions",
    fetch: submissionService.getSubmissions,
    fields: (s) => [s.studentName, s.assignmentTitle, s.status],
    toResult: (s) => ({
      id: s.id,
      title: s.studentName,
      subtitle: `${s.assignmentTitle} · ${s.status}`,
      href: `/admin/overview?highlight=${rowId("submission", s.id)}`,
    }),
  }),
];

const teacherSources: AnySource[] = [
  source({
    group: "Assignments",
    fetch: assignmentService.getAssignments,
    fields: (a) => [a.title, a.description, a.subjectName, a.className, a.status],
    toResult: (a) => ({
      id: a.id,
      title: a.title,
      subtitle: `${a.subjectName} · ${a.className} · ${a.status}`,
      href: `/teacher/assignments?highlight=${rowId("assignment", a.id)}`,
    }),
  }),
  source({
    group: "Submissions",
    fetch: submissionService.getSubmissions,
    fields: (s) => [s.studentName, s.assignmentTitle, s.status],
    toResult: (s) => ({
      id: s.id,
      title: s.studentName,
      subtitle: `${s.assignmentTitle} · ${s.status}`,
      href: `/teacher/assignments/${s.assignmentId}/submissions?highlight=${rowId("submission", s.id)}`,
    }),
  }),
];

const studentSources: AnySource[] = [
  source({
    group: "Assignments",
    fetch: assignmentService.getAssignments,
    fields: (a) => [a.title, a.description, a.subjectName, a.teacherName],
    toResult: (a) => ({
      id: a.id,
      title: a.title,
      subtitle: `${a.subjectName} · Due ${formatDeadline(a.deadline)}`,
      href: `/student/assignments/${a.id}`,
    }),
  }),
  source({
    group: "My Submissions",
    fetch: submissionService.getSubmissions,
    fields: (s) => [s.assignmentTitle, s.status, s.feedback],
    toResult: (s) => ({
      id: s.id,
      title: s.assignmentTitle,
      subtitle: s.status === "Graded" ? `Graded · ${s.marks}/${s.maxMarks}` : "Submitted",
      href: `/student/submissions?highlight=${rowId("submission", s.id)}`,
    }),
  }),
];

const SOURCES: Record<Role, AnySource[]> = {
  Admin: adminSources,
  Teacher: teacherSources,
  Student: studentSources,
};

// Bidirectional so a plural query ("teachers") still matches a singular
// field value ("Teacher", e.g. a user's role) and vice versa - a plain
// field.includes(query) check only catches queries no longer than the field.
// The query-includes-value direction is gated to values of at least 3
// characters, otherwise a short field (e.g. a class section letter like "A")
// would trivially match almost any unrelated query that happens to contain
// that character.
function textMatches(value: string, query: string): boolean {
  return value.includes(query) || (value.length >= 3 && query.includes(value));
}

function matches(fields: Array<string | number | null | undefined>, query: string): boolean {
  return fields.some((field) => field != null && textMatches(String(field).toLowerCase(), query));
}

// Sidebar pages are searchable too (typing "classes" should find the Classes
// page), the same way the landing page search finds its sections.
function searchPages(role: Role, query: string): SearchResult[] {
  return NAV_LINKS[role]
    .filter((link) => textMatches(link.label.toLowerCase(), query))
    .map((link) => ({ group: "Pages", id: link.href, title: link.label, href: link.href }));
}

// Fetches every source for the role in parallel and returns all matches,
// ordered by group in the order the sources are declared above.
export async function searchAll(role: Role, rawQuery: string): Promise<SearchResult[]> {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return [];

  const sources = SOURCES[role];
  const lists = await Promise.all(sources.map((s) => s.fetch()));

  const results: SearchResult[] = searchPages(role, query);
  sources.forEach((s, index) => {
    for (const item of lists[index]) {
      if (matches(s.fields(item), query)) {
        results.push({ group: s.group, ...s.toResult(item) });
      }
    }
  });
  return results;
}
