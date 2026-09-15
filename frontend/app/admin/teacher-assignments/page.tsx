"use client";

import { ReactNode, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { BackButton } from "@/components/ui/BackButton";
import { IconButton } from "@/components/ui/IconButton";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { TeacherAssignmentForm } from "@/components/forms/TeacherAssignmentForm";
import { getErrorMessage } from "@/services/axiosInstance";
import * as teacherAssignmentService from "@/services/teacherAssignmentService";
import * as userService from "@/services/userService";
import * as classService from "@/services/classService";
import * as subjectService from "@/services/subjectService";
import { useHighlightRow } from "@/hooks/useHighlightRow";
import { rowId } from "@/lib/globalSearch";
import { TeacherAssignment } from "@/types/teacherAssignment";
import { User } from "@/types/user";
import { SchoolClass } from "@/types/class";
import { Subject } from "@/types/subject";

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      const [assignmentsData, usersData, classesData, subjectsData] = await Promise.all([
        teacherAssignmentService.getTeacherAssignments(),
        userService.getUsers(),
        classService.getClasses(),
        subjectService.getSubjects(),
      ]);
      setAssignments(assignmentsData);
      setTeachers(usersData.filter((u) => u.role === "Teacher"));
      setClasses(classesData);
      setSubjects(subjectsData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(loadData);
  }, []);

  useHighlightRow(!isLoading && !error);

  async function handleFormSuccess() {
    setModalOpen(false);
    await loadData();
  }

  async function handleDelete(assignment: TeacherAssignment) {
    setActionError(null);
    if (
      !confirm(
        `Remove ${assignment.teacherName} from teaching ${assignment.subjectName} to ${assignment.className}?`
      )
    )
      return;
    try {
      await teacherAssignmentService.deleteTeacherAssignment(assignment.id);
      await loadData();
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Teacher Assignments</h1>
          <p className="mt-1 text-sm text-slate-500">
            Assign teachers to teach a subject for a class.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Assign teacher
        </Button>
      </div>

      {actionError && <ErrorMessage message={actionError} />}
      {error && <ErrorMessage message={error} />}
      {isLoading && <Spinner label="Loading teacher assignments..." />}

      {!isLoading && !error && assignments.length === 0 && (
        <EmptyState message="No teacher assignments found." />
      )}

      {!isLoading && !error && assignments.length > 0 && (
        <div className="table-scroll rounded border border-slate-100 bg-white shadow-card">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-navy-100">
              <tr>
                <Th>Teacher</Th>
                <Th>Subject</Th>
                <Th>Class</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assignments.map((a) => (
                <tr
                  key={a.id}
                  id={rowId("teacher-assignment", a.id)}
                  className="scroll-mt-24 transition-colors duration-200 hover:bg-slate-50"
                >
                  <Td>{a.teacherName}</Td>
                  <Td>{a.subjectName}</Td>
                  <Td>{a.className}</Td>
                  <Td>
                    <IconButton
                      icon={Trash2}
                      label="Remove teacher assignment"
                      tone="danger"
                      onClick={() => handleDelete(a)}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Assign teacher">
        <TeacherAssignmentForm
          teachers={teachers}
          classes={classes}
          subjects={subjects}
          onSuccess={handleFormSuccess}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

function Th({ children }: { children: ReactNode }) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function Td({ children }: { children: ReactNode }) {
  return <td className="whitespace-nowrap px-4 py-3 text-slate-700">{children}</td>;
}
