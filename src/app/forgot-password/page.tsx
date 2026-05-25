"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@/lib/zodResolver";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      setSent(true);
    } catch {
      setSent(true); // Show success even on error for security
    } finally {
      setLoading(false);
    }
  };

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

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-card border border-neutral-100 p-8">
            {sent ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-success-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-success-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                  </svg>
                </div>
                <h1 className="text-xl font-heading font-bold text-neutral-900 mb-2">Check your email</h1>
                <p className="text-neutral-500 text-sm mb-6">
                  We&apos;ve sent a password reset link to your email address. Check your inbox (and spam folder).
                </p>
                <Link href="/login" className="btn-outline inline-flex">
                  Back to Sign In
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-primary-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <h1 className="text-xl font-heading font-bold text-neutral-900">Forgot your password?</h1>
                  <p className="text-neutral-500 text-sm mt-2">
                    Enter your email and we&apos;ll send you a link to reset it.
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    error={errors.email?.message}
                    {...register("email")}
                  />
                  <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
                    Send Reset Link
                  </Button>
                </form>

                <p className="text-center text-sm text-neutral-500 mt-6">
                  Remember your password?{" "}
                  <Link href="/login" className="text-primary-800 font-medium hover:underline">
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
