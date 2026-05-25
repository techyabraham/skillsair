"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@/lib/zodResolver";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const loginSchema = z.object({
  username: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, error: authError, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      const next = searchParams.get("next") || "/dashboard";
      router.push(next);
    } catch {
      // Error shown via authError
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {authError && (
        <div className="p-3.5 rounded-xl bg-error-light border border-error/20 text-sm text-error-dark" role="alert">
          {authError}
        </div>
      )}

      <Input
        label="Email or Username"
        type="text"
        autoComplete="username"
        placeholder="you@example.com"
        error={errors.username?.message}
        {...register("username")}
      />

      <Input
        label="Password"
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        placeholder="Enter your password"
        error={errors.password?.message}
        rightIcon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            {showPassword ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            )}
          </svg>
        }
        onRightIconClick={() => setShowPassword((v) => !v)}
        {...register("password")}
      />

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 text-primary-800 border-neutral-300 rounded focus:ring-primary-800/30"
            {...register("rememberMe")}
          />
          <span className="text-sm text-neutral-600">Remember me</span>
        </label>
        <Link href="/forgot-password" className="text-sm text-primary-800 hover:underline font-medium">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" variant="primary" size="lg" fullWidth loading={isLoading}>
        Sign In
      </Button>
    </form>
  );
}
