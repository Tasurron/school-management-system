import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

// Gold fill for primary actions, navy fill for secondary, both with real
// light/dark shade pairs now (matching the reference), so hover states and
// text contrast work the ordinary way instead of needing workarounds.
const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary-500 text-navy-900 hover:bg-navy-800 hover:text-white focus-visible:ring-primary-500 shadow-sm",
  secondary:
    "border-2 border-navy-800 bg-white text-navy-800 hover:bg-navy-50 focus-visible:ring-navy-500",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-400",
};

// Compact pill sizing, closer to the reference's modestly-sized buttons.
const sizeClasses: Record<Size, string> = {
  sm: "px-3.5 py-1 text-xs",
  md: "px-5 py-2 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", isLoading, disabled, className = "", children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-[0.03em] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...rest}
    >
      {isLoading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
});
