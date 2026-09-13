import { ButtonHTMLAttributes, forwardRef } from "react";
import type { LucideIcon } from "lucide-react";

type Tone = "neutral" | "primary" | "danger";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  tone?: Tone;
}

const toneClasses: Record<Tone, string> = {
  neutral: "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
  primary: "text-primary-700 hover:bg-primary-50",
  danger: "text-red-500 hover:bg-red-50 hover:text-red-600",
};

// Icon-only row action, replacing the old text buttons in tables - keeps a
// real accessible label (aria-label + native tooltip) even though there's no
// visible text. Defaults to gold (matching the reference's icon color);
// destructive actions pass tone="danger" to stay red.
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon: Icon, label, tone = "primary", className = "", disabled, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:scale-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 ${toneClasses[tone]} ${className}`}
      {...rest}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
});
