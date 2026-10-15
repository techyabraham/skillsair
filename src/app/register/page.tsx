import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Logo } from "@/components/ui/Logo";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your SkillsAir account.",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="py-4 px-6 bg-white border-b border-neutral-100">
        <Logo variant="on-light" size="sm" />
      </header>

      <main className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-heading font-bold text-neutral-900">Create your account</h1>
            <p className="text-neutral-500 text-sm mt-2">
              Applying for a programme?{" "}
              <Link href="/apply" className="font-semibold text-primary-800 underline">Start here instead</Link>{" "}
              to see your scholarship offer.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-card border border-neutral-100 p-8">
            <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-neutral-100" />}>
              <RegisterForm />
            </Suspense>
          </div>
          <p className="text-center text-sm text-neutral-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-primary-800 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
