"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  label?: string;
  className?: string;
}

export function BackButton({ label = "Back", className = "" }: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={`group inline-flex items-center gap-1.5 self-start text-sm font-medium text-slate-500 transition-colors duration-200 hover:text-primary-600 ${className}`}
    >
      <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
      {label}
    </button>
  );
}
