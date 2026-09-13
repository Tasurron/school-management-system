import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type Tone = "neutral" | "primary";

interface IconLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
  tone?: Tone;
}

const toneClasses: Record<Tone, string> = {
  neutral: "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
  primary: "text-primary-700 hover:bg-primary-50",
};

// Icon-only row action for navigation (view/edit/grade links), matching
// IconButton's look for onClick actions in the same tables.
export function IconLink({ href, icon: Icon, label, tone = "primary" }: IconLinkProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:scale-110 ${toneClasses[tone]}`}
    >
      <Icon className="h-4 w-4" />
    </Link>
  );
}
