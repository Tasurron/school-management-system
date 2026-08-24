"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { assignmentSchema, AssignmentFormValues } from "@/schemas/assignmentSchema";
import * as assignmentService from "@/services/assignmentService";
import { getErrorMessage } from "@/services/axiosInstance";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Assignment } from "@/types/assignment";
import { TeacherAssignment } from "@/types/teacherAssignment";

interface AssignmentFormProps {
  /** The signed-in teacher's own (class, subject) combinations they may pick from. */
  teacherAssignments: TeacherAssignment[];
  assignment?: Assignment;
  onSuccess: (assignment: Assignment) => void;
  onCancel: () => void;
}

function toDateTimeLocalValue(isoString: string): string {
  // <input type="datetime-local"> needs "YYYY-MM-DDTHH:mm" in local time.
  const date = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export function AssignmentForm({
  teacherAssignments,
  assignment,
  onSuccess,
  onCancel,
}: AssignmentFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const isEdit = !!assignment;

  const defaultKey = assignment ? `${assignment.classId}:${assignment.subjectId}` : "";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: assignment?.title ?? "",
      description: assignment?.description ?? "",
      deadline: assignment ? toDateTimeLocalValue(assignment.deadline) : "",
      maxMarks: assignment?.maxMarks ?? 100,
      classSubjectKey: defaultKey,
      status: assignment?.status ?? "Draft",
    },
  });

  async function onSubmit(values: AssignmentFormValues) {
    setServerError(null);
    const [classIdStr, subjectIdStr] = values.classSubjectKey.split(":");

    try {
      const input = {
        title: values.title,
        description: values.description,
        deadline: new Date(values.deadline).toISOString(),
        maxMarks: values.maxMarks,
        classId: Number(classIdStr),
        subjectId: Number(subjectIdStr),
        status: values.status,
      };

      const saved = isEdit
        ? await assignmentService.updateAssignment(assignment.id, input)
        : await assignmentService.createAssignment(input);

      onSuccess(saved);
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {serverError && <ErrorMessage message={serverError} />}
      <Input label="Title" error={errors.title?.message} {...register("title")} />
      <Textarea
        label="Description"
        error={errors.description?.message}
        {...register("description")}
      />
      <Select
        label="Class + Subject"
        error={errors.classSubjectKey?.message}
        {...register("classSubjectKey")}
        defaultValue={defaultKey}
      >
        <option value="" disabled>
          Select class + subject
        </option>
        {teacherAssignments.map((ta) => (
          <option key={ta.id} value={`${ta.classId}:${ta.subjectId}`}>
            {ta.className} - {ta.subjectName}
          </option>
        ))}
      </Select>
      <Input
        label="Deadline"
        type="datetime-local"
        error={errors.deadline?.message}
        {...register("deadline")}
      />
      <Input
        label="Max marks"
        type="number"
        error={errors.maxMarks?.message}
        {...register("maxMarks", { valueAsNumber: true })}
      />
      <Select label="Status" error={errors.status?.message} {...register("status")}>
        <option value="Draft">Draft</option>
        <option value="Published">Published</option>
      </Select>
      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {isEdit ? "Save changes" : "Create assignment"}
        </Button>
      </div>
    </form>
  );
}
