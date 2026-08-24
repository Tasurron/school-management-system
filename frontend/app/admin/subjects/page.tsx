"use client";

import { ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { SubjectForm } from "@/components/forms/SubjectForm";
import { getErrorMessage } from "@/services/axiosInstance";
import * as subjectService from "@/services/subjectService";
import { Subject } from "@/types/subject";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | undefined>(undefined);

  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      setSubjects(await subjectService.getSubjects());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openCreateModal() {
    setSelectedSubject(undefined);
    setModalOpen(true);
  }

  function openEditModal(subject: Subject) {
    setSelectedSubject(subject);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSelectedSubject(undefined);
  }

  async function handleFormSuccess() {
    closeModal();
    await loadData();
  }

  async function handleDelete(subject: Subject) {
    setActionError(null);
    if (!confirm(`Delete "${subject.name}"? This cannot be undone.`)) return;
    try {
      await subjectService.deleteSubject(subject.id);
      await loadData();
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subjects</h1>
          <p className="mt-1 text-sm text-slate-500">Manage the subjects taught in your school.</p>
        </div>
        <Button onClick={openCreateModal}>Add subject</Button>
      </div>

      {actionError && <ErrorMessage message={actionError} />}
      {error && <ErrorMessage message={error} />}
      {isLoading && <Spinner label="Loading subjects..." />}

      {!isLoading && !error && subjects.length === 0 && (
        <EmptyState message="No subjects found." />
      )}

      {!isLoading && !error && subjects.length > 0 && (
        <div className="table-scroll rounded border border-slate-100 bg-white shadow-card">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-navy-50">
              <tr>
                <Th>Name</Th>
                <Th>Code</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects.map((s) => (
                <tr key={s.id} className="transition-colors duration-200 hover:bg-slate-50">
                  <Td>{s.name}</Td>
                  <Td>{s.code ?? "-"}</Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openEditModal(s)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(s)}>
                        Delete
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={selectedSubject ? "Edit subject" : "Add subject"}
      >
        <SubjectForm
          subject={selectedSubject}
          onSuccess={handleFormSuccess}
          onCancel={closeModal}
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
