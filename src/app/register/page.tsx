import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Join SkillsAir and start learning from expert instructors today.",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="py-4 px-6 bg-white border-b border-neutral-100">
        <Link href="/" className="flex items-center gap-2 w-fit" aria-label="Return to home">
          <div className="w-8 h-8 bg-hero-gradient rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-lg font-heading font-bold text-primary-800">
            Skills<span className="text-accent">Air</span>
          </span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-heading font-bold text-neutral-900">Create your account</h1>
            <p className="text-neutral-500 text-sm mt-2">
              Join 50,000+ professionals learning on SkillsAir
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-card border border-neutral-100 p-8">
            <RegisterForm />
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
