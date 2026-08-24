import { HTMLAttributes } from "react";

export function Card({ className = "", children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded border border-slate-100 bg-white p-5 shadow-card transition-shadow duration-200 hover:shadow-lg ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
