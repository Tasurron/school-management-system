import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { ForgotPasswordForm } from "@/components/forms/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f0f2f5] px-4 py-10">
      <div className="w-full max-w-sm fade-in">
        <Link
          href="/login"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors duration-200 hover:text-primary-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-500">
            <GraduationCap className="h-7 w-7 text-navy-900" />
          </div>
          <h1 className="text-2xl font-bold text-navy-800">Forgot Password</h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter your email and we&apos;ll send you a reset code
          </p>
        </div>
        <div className="rounded bg-white p-8 shadow-card">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
