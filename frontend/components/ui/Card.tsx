import { HTMLAttributes } from "react";

export function Card({ className = "", children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const hasBg = /(^|\s)bg-/.test(className);
  return (
    <div
      className={`rounded border border-slate-100 ${hasBg ? "" : "bg-white"} p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
