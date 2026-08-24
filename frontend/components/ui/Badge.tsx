import { ReactNode } from "react";

type Tone = "green" | "yellow" | "gray" | "red";

const toneClasses: Record<Tone, string> = {
  green: "bg-green-100 text-green-800",
  yellow: "bg-primary-100 text-primary-800",
  gray: "bg-slate-100 text-slate-700",
  red: "bg-red-100 text-red-800",
};

export function Badge({ tone = "gray", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
