"use client";

import { ReactNode, useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { BackButton } from "@/components/ui/BackButton";
import { IconButton } from "@/components/ui/IconButton";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ClassForm } from "@/components/forms/ClassForm";
import { getErrorMessage } from "@/services/axiosInstance";
import * as classService from "@/services/classService";
import { SchoolClass } from "@/types/class";

export default function ClassesPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<SchoolClass | undefined>(undefined);

  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      setClasses(await classService.getClasses());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(loadData);
  }, []);

  function openCreateModal() {
    setSelectedClass(undefined);
    setModalOpen(true);
  }

  function openEditModal(schoolClass: SchoolClass) {
    setSelectedClass(schoolClass);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSelectedClass(undefined);
  }

  async function handleFormSuccess() {
    closeModal();
    await loadData();
  }

  async function handleDelete(schoolClass: SchoolClass) {
    setActionError(null);
    if (!confirm(`Delete "${schoolClass.name}"? This cannot be undone.`)) return;
    try {
      await classService.deleteClass(schoolClass.id);
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
          <h1 className="text-2xl font-bold text-slate-900">Classes</h1>
          <p className="mt-1 text-sm text-slate-500">Manage the classes in your school.</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Add class
        </Button>
      </div>

      {actionError && <ErrorMessage message={actionError} />}
      {error && <ErrorMessage message={error} />}
      {isLoading && <Spinner label="Loading classes..." />}

      {!isLoading && !error && classes.length === 0 && <EmptyState message="No classes found." />}

      {!isLoading && !error && classes.length > 0 && (
        <div className="table-scroll rounded border border-slate-100 bg-white shadow-card">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-navy-50">
              <tr>
                <Th>Name</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classes.map((c) => (
                <tr key={c.id} className="transition-colors duration-200 hover:bg-slate-50">
                  <Td>{c.name}</Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <IconButton icon={Pencil} label="Edit class" onClick={() => openEditModal(c)} />
                      <IconButton
                        icon={Trash2}
                        label="Delete class"
                        tone="danger"
                        onClick={() => handleDelete(c)}
                      />
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={closeModal} title={selectedClass ? "Edit class" : "Add class"}>
        <ClassForm schoolClass={selectedClass} onSuccess={handleFormSuccess} onCancel={closeModal} />
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
