"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SubmissionForm } from "@/components/forms/SubmissionForm";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { getErrorMessage } from "@/services/axiosInstance";
import * as assignmentService from "@/services/assignmentService";
import * as submissionService from "@/services/submissionService";
import { Assignment } from "@/types/assignment";
import { Submission } from "@/types/submission";

export default function StudentAssignmentDetailPage() {
  const params = useParams<{ id: string }>();
  const assignmentId = Number(params.id);

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const [assignmentData, submissions] = await Promise.all([
          assignmentService.getAssignmentById(assignmentId),
          submissionService.getSubmissions(),
        ]);
        setAssignment(assignmentData);
        setSubmission(submissions.find((s) => s.assignmentId === assignmentId) ?? null);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }
    queueMicrotask(loadData);
  }, [assignmentId]);

  if (isLoading) return <Spinner label="Loading assignment..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!assignment) return null;

  const isPastDeadline = new Date() > new Date(assignment.deadline);
  const isGraded = submission?.status === "Graded";
  const isLocked = isPastDeadline || isGraded;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-2xl font-bold text-slate-900">{assignment.title}</h1>
          <Badge tone={isPastDeadline ? "red" : "green"}>
            {isPastDeadline ? "Past deadline" : "Open"}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {assignment.subjectName} - {assignment.className}
        </p>
      </div>

      <Card>
        <p className="text-sm font-medium text-slate-500">Description</p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
          {assignment.description}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-slate-500">Deadline</p>
            <p className="text-slate-800">{new Date(assignment.deadline).toLocaleString()}</p>
          </div>
          <div>
            <p className="font-medium text-slate-500">Max marks</p>
            <p className="text-slate-800">{assignment.maxMarks}</p>
          </div>
        </div>
      </Card>

      {/* Case 1: graded submission - always read-only, show marks/feedback. */}
      {submission && isGraded && (
        <div className="flex flex-col gap-4">
          <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            This submission has been graded and can no longer be edited.
          </div>
          <ReadOnlySubmission submission={submission} />
          <Card>
            <p className="text-sm font-medium text-slate-500">Marks</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {submission.marks} / {submission.maxMarks}
            </p>
            {submission.feedback && (
              <>
                <p className="mt-3 text-sm font-medium text-slate-500">Feedback</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                  {submission.feedback}
                </p>
              </>
            )}
          </Card>
        </div>
      )}

      {/* Case 2: submission exists, not graded, but the deadline has passed. */}
      {submission && !isGraded && isPastDeadline && (
        <div className="flex flex-col gap-4">
          <div className="rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            Deadline passed - submission is locked.
          </div>
          <ReadOnlySubmission submission={submission} />
        </div>
      )}

      {/* Case 3: submission exists, not graded, deadline still open - editable. */}
      {submission && !isLocked && (
        <div className="rounded border border-slate-100 bg-white p-6 shadow-card">
          <SubmissionForm
            assignmentId={assignment.id}
            existingSubmission={submission}
            onSuccess={(updated) => setSubmission(updated)}
          />
        </div>
      )}

      {/* Case 4: no submission yet, deadline has passed. */}
      {!submission && isPastDeadline && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Deadline passed - you did not submit this assignment.
        </div>
      )}

      {/* Case 5: no submission yet, deadline still open - empty submit form. */}
      {!submission && !isPastDeadline && (
        <div className="rounded border border-slate-100 bg-white p-6 shadow-card">
          <SubmissionForm
            assignmentId={assignment.id}
            onSuccess={(created) => setSubmission(created)}
          />
        </div>
      )}
    </div>
  );
}

function ReadOnlySubmission({ submission }: { submission: Submission }) {
  return (
    <Card>
      <p className="text-sm font-medium text-slate-500">Your answer</p>
      <p className="mt-1 whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm text-slate-800">
        {submission.content}
      </p>
      <p className="mt-3 text-xs text-slate-400">
        Submitted: {new Date(submission.submittedAt).toLocaleString()}
      </p>
    </Card>
  );
}
