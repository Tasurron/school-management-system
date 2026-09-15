import type { LucideIcon } from "lucide-react";
import { Card } from "./Card";

type Tone = "amber" | "navy" | "gray" | "green" | "red";

const toneClasses: Record<Tone, string> = {
  amber: "bg-primary-100 text-primary-700",
  navy: "bg-navy-800 text-white",
  gray: "bg-violet-500 text-white",
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-700",
};

const cardToneClasses: Record<Tone, string> = {
  amber: "bg-primary-50",
  navy: "bg-blue-100",
  gray: "bg-violet-100",
  green: "bg-green-50",
  red: "bg-red-50",
};

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: Tone;
}

export function StatCard({ label, value, icon: Icon, tone = "amber" }: StatCardProps) {
  return (
    <Card className={`flex items-center gap-4 ${cardToneClasses[tone]}`}>
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${toneClasses[tone]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-3xl font-bold text-slate-900">{value}</p>
        <p className="text-sm font-medium text-slate-500">{label}</p>
      </div>
    </Card>
  );
}
