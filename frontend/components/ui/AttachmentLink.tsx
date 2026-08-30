"use client";

import { useState } from "react";
import { Paperclip } from "lucide-react";
import * as assignmentService from "@/services/assignmentService";

interface AttachmentLinkProps {
  assignmentId: number;
  fileName: string;
}

export function AttachmentLink({ assignmentId, fileName }: AttachmentLinkProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setIsDownloading(true);
    try {
      await assignmentService.downloadAttachment(assignmentId, fileName);
    } catch {
      setError("Could not download the file.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isDownloading}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 transition-colors duration-200 hover:text-primary-800 disabled:opacity-60"
      >
        <Paperclip className="h-4 w-4" />
        {isDownloading ? "Downloading..." : fileName}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
