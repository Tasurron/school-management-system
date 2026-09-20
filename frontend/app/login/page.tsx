import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { LoginForm } from "@/components/forms/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f0f2f5] px-4 py-10">
      <div className="w-full max-w-sm fade-in">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors duration-200 hover:text-primary-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        <div className="mb-6 text-center">
          <Link href="/" className="inline-block">
            <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-500 transition-transform duration-200 hover:scale-105">
              <GraduationCap className="h-7 w-7 text-navy-900" />
            </div>
            <h1 className="text-2xl font-bold text-navy-800">School Management System</h1>
          </Link>
          <p className="mt-1 text-sm text-slate-500">Sign in to continue</p>
        </div>
        <div className="rounded bg-white p-8 shadow-card">
          <LoginForm />
          <p className="mt-4 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-primary-600 hover:text-primary-700">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
