"use client";

import { ReactNode, Suspense, useEffect, useState } from "react";
import { Plus, Pencil, UserX, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { BackButton } from "@/components/ui/BackButton";
import { IconButton } from "@/components/ui/IconButton";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { UserForm } from "@/components/forms/UserForm";
import { getErrorMessage } from "@/services/axiosInstance";
import * as userService from "@/services/userService";
import * as classService from "@/services/classService";
import { useHighlightRow } from "@/hooks/useHighlightRow";
import { rowId } from "@/lib/globalSearch";
import { User } from "@/types/user";
import { SchoolClass } from "@/types/class";

export default function UsersPage() {
  return (
    <Suspense>
      <UsersPageContent />
    </Suspense>
  );
}

function UsersPageContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
  const [actionError, setActionError] = useState<string | null>(null);

  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      const [usersData, classesData] = await Promise.all([
        userService.getUsers(),
        classService.getClasses(),
      ]);
      setUsers(usersData);
      setClasses(classesData);
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

  function openCreateModal() {
    setSelectedUser(undefined);
    setModalMode("create");
  }

  function openEditModal(user: User) {
    setSelectedUser(user);
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setSelectedUser(undefined);
  }

  async function handleFormSuccess() {
    closeModal();
    await loadData();
  }

  async function handleDeactivate(user: User) {
    setActionError(null);
    if (!confirm(`Deactivate ${user.fullName}?`)) return;
    try {
      await userService.deactivateUser(user.id);
      await loadData();
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  }

  async function handleActivate(user: User) {
    setActionError(null);
    if (!confirm(`Reactivate ${user.fullName}?`)) return;
    try {
      await userService.activateUser(user.id);
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
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="mt-1 text-sm text-slate-500">Manage admins, teachers, and students.</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Add user
        </Button>
      </div>

      {actionError && <ErrorMessage message={actionError} />}
      {error && <ErrorMessage message={error} />}
      {isLoading && <Spinner label="Loading users..." />}

      {!isLoading && !error && users.length === 0 && <EmptyState message="No users found." />}

      {!isLoading && !error && users.length > 0 && (
        <div className="table-scroll rounded border border-slate-100 bg-white shadow-card">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-navy-100">
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Class</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr
                  key={u.id}
                  id={rowId("user", u.id)}
                  className="scroll-mt-24 transition-colors duration-200 hover:bg-slate-50"
                >
                  <Td>{u.fullName}</Td>
                  <Td>{u.email}</Td>
                  <Td>{u.role}</Td>
                  <Td>{u.className ?? "-"}</Td>
                  <Td>
                    <Badge tone={u.isActive === false ? "red" : "green"}>
                      {u.isActive === false ? "Inactive" : "Active"}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <IconButton icon={Pencil} label="Edit user" onClick={() => openEditModal(u)} />
                      {u.isActive !== false ? (
                        <IconButton
                          icon={UserX}
                          label="Deactivate user"
                          tone="danger"
                          onClick={() => handleDeactivate(u)}
                        />
                      ) : (
                        <IconButton
                          icon={UserCheck}
                          label="Reactivate user"
                          tone="primary"
                          onClick={() => handleActivate(u)}
                        />
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={modalMode !== null}
        onClose={closeModal}
        title={modalMode === "edit" ? "Edit user" : "Add user"}
      >
        {modalMode && (
          <UserForm
            mode={modalMode}
            user={selectedUser}
            classes={classes}
            onSuccess={handleFormSuccess}
            onCancel={closeModal}
          />
        )}
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
