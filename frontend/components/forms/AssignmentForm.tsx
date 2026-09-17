"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  assignmentSchema,
  AssignmentFormValues,
  ALLOWED_ATTACHMENT_EXTENSIONS,
} from "@/schemas/assignmentSchema";
import { GRADE_OPTIONS, SECTION_OPTIONS } from "@/schemas/classSchema";
import * as assignmentService from "@/services/assignmentService";
import { getErrorMessage } from "@/services/axiosInstance";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Assignment } from "@/types/assignment";
import { Subject } from "@/types/subject";

interface AssignmentFormProps {
  subjects: Subject[];
  assignment?: Assignment;
  onSuccess: (assignment: Assignment) => void;
  onCancel: () => void;
}

interface DeadlineParts {
  date: string; // "YYYY-MM-DD" - the value format <input type="date"> always uses internally
  time: string; // "HH:mm"
}

function splitDeadline(isoString?: string): DeadlineParts {
  if (!isoString) {
    return { date: "", time: "" };
  }
  const date = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

function combineDeadline(parts: DeadlineParts): string {
  if (!parts.date || !parts.time) return "";
  const [year, month, day] = parts.date.split("-").map(Number);
  const [hours, minutes] = parts.time.split(":").map(Number);
  const date = new Date(year, month - 1, day, hours, minutes);
  return date.toISOString();
}

export function AssignmentForm({ subjects, assignment, onSuccess, onCancel }: AssignmentFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [deadlineParts, setDeadlineParts] = useState<DeadlineParts>(
    splitDeadline(assignment?.deadline)
  );
  const isEdit = !!assignment;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: assignment?.title ?? "",
      description: assignment?.description ?? "",
      deadline: assignment?.deadline ? combineDeadline(splitDeadline(assignment.deadline)) : "",
      maxMarks: assignment?.maxMarks ?? 100,
      classGrade: assignment?.classGrade,
      classSection: assignment?.classSection ?? "",
      subjectId: assignment?.subjectId,
      status: assignment?.status ?? "Draft",
      removeAttachment: false,
    },
  });

  const removeAttachment = watch("removeAttachment");
  const attachmentFile = watch("attachment");
  const classGrade = watch("classGrade");
  const subjectId = watch("subjectId");

  // Only show subjects offered for the selected class. The assignment's current subject stays
  // visible even if it isn't offered for that grade (e.g. a legacy subject like "Computer
  // Science" on an older assignment), so editing doesn't force the teacher to change it.
  const filteredSubjects = subjects.filter(
    (s) => (classGrade !== undefined && s.applicableGrades.includes(classGrade)) || s.id === subjectId
  );

  function updateDeadlinePart(patch: Partial<DeadlineParts>) {
    const next = { ...deadlineParts, ...patch };
    setDeadlineParts(next);
    setValue("deadline", combineDeadline(next), { shouldValidate: true });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setValue("attachment", file, { shouldValidate: true });
    if (file) {
      setValue("removeAttachment", false);
    }
  }

  async function onSubmit(values: AssignmentFormValues) {
    setServerError(null);

    if (!values.classGrade || !values.classSection || !values.subjectId) {
      setServerError("Please select a class, section, and subject.");
      return;
    }

    try {
      const input = {
        title: values.title,
        description: values.description,
        deadline: values.deadline,
        maxMarks: values.maxMarks,
        classGrade: values.classGrade,
        classSection: values.classSection,
        subjectId: values.subjectId,
        status: values.status,
        attachment: values.attachment ?? undefined,
        removeAttachment: values.removeAttachment,
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Input label="Title" error={errors.title?.message} {...register("title")} />

          <div className="flex flex-col gap-1">
            <Textarea
              label="Description"
              error={errors.description?.message}
              {...register("description")}
            />
            <input
              type="file"
              accept={ALLOWED_ATTACHMENT_EXTENSIONS.join(",")}
              onChange={handleFileChange}
              className="mt-2 rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm file:mr-3 file:rounded-full file:border-0 file:bg-navy-100 file:px-4 file:py-1.5 file:text-navy-800 file:hover:bg-navy-200"
            />
            <p className="text-xs text-slate-400">
              Attach a Word, PDF, Excel, or image file (up to 10 MB) - optional.
            </p>
            {errors.attachment?.message && (
              <p className="text-xs text-red-600">{errors.attachment.message}</p>
            )}
            {isEdit && assignment?.attachmentFileName && !attachmentFile && (
              <div className="mt-1 flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <span className={removeAttachment ? "text-slate-400 line-through" : "text-slate-700"}>
                  Current file: {assignment.attachmentFileName}
                </span>
                <button
                  type="button"
                  onClick={() => setValue("removeAttachment", !removeAttachment)}
                  className="text-xs font-medium text-red-600 hover:text-red-700"
                >
                  {removeAttachment ? "Undo" : "Remove"}
                </button>
              </div>
            )}
          </div>

          <Select
            label="Class"
            error={errors.classGrade?.message}
            value={classGrade ?? ""}
            onChange={(e) => {
              const grade = e.target.value ? Number(e.target.value) : undefined;
              setValue("classGrade", grade, { shouldValidate: true });
              // The subject list depends on the class, so a subject picked for the old class may no
              // longer apply - clear it and make the teacher choose again from the new list.
              setValue("subjectId", undefined, { shouldValidate: true });
            }}
          >
            <option value="" disabled>
              Select a class
            </option>
            {GRADE_OPTIONS.map((g) => (
              <option key={g} value={g}>
                Class {g}
              </option>
            ))}
          </Select>

          <Select
            label="Section"
            error={errors.classSection?.message}
            value={watch("classSection") ?? ""}
            onChange={(e) => setValue("classSection", e.target.value, { shouldValidate: true })}
          >
            <option value="" disabled>
              Select a section
            </option>
            {SECTION_OPTIONS.map((s) => (
              <option key={s} value={s}>
                Section {s}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-4">
          <Select
            label="Subject"
            error={errors.subjectId?.message}
            value={subjectId ?? ""}
            disabled={classGrade === undefined}
            onChange={(e) => setValue("subjectId", e.target.value ? Number(e.target.value) : undefined, { shouldValidate: true })}
          >
            <option value="" disabled>
              {classGrade === undefined ? "Select a class first" : "Select a subject"}
            </option>
            {filteredSubjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>

          <div className="flex flex-col gap-1">
            <div className="grid grid-cols-2 gap-4">
              <DatePicker
                label="Deadline date"
                value={deadlineParts.date}
                onChange={(iso) => updateDeadlinePart({ date: iso })}
                error={errors.deadline && !deadlineParts.date ? " " : undefined}
              />
              <Input
                label="Deadline time"
                type="time"
                value={deadlineParts.time}
                onChange={(e) => updateDeadlinePart({ time: e.target.value })}
                error={errors.deadline && !deadlineParts.time ? " " : undefined}
              />
            </div>
            {errors.deadline?.message && (
              <p className="text-xs text-red-600">{errors.deadline.message}</p>
            )}
          </div>

          <Input
            label="Marks"
            type="number"
            error={errors.maxMarks?.message}
            {...register("maxMarks", { valueAsNumber: true })}
          />

          <Select label="Status" error={errors.status?.message} {...register("status")}>
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
          </Select>
        </div>
      </div>

      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="light" isLoading={isSubmitting}>
          {isEdit ? "Save changes" : "Create assignment"}
        </Button>
      </div>
    </form>
  );
}
