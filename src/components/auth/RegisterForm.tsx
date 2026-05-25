"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@/lib/zodResolver";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const registerSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Enter a valid email address"),
    phone: z.string().optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((v) => v, "You must accept the terms"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const { register: registerUser, error: authError, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { acceptTerms: false },
  });

  const password = watch("password", "");

  const getPasswordStrength = () => {
    if (!password) return { level: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { level: 25, label: "Weak", color: "bg-error" };
    if (score === 2) return { level: 50, label: "Fair", color: "bg-warning" };
    if (score === 3) return { level: 75, label: "Good", color: "bg-primary-600" };
    return { level: 100, label: "Strong", color: "bg-success" };
  };

  const strength = getPasswordStrength();

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        acceptTerms: data.acceptTerms,
      });
      router.push("/dashboard");
    } catch {
      // Error shown via authError
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {authError && (
        <div className="p-3.5 rounded-xl bg-error-light border border-error/20 text-sm text-error-dark" role="alert">
          {authError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First Name"
          placeholder="John"
          autoComplete="given-name"
          error={errors.firstName?.message}
          {...register("firstName")}
        />
        <Input
          label="Last Name"
          placeholder="Doe"
          autoComplete="family-name"
          error={errors.lastName?.message}
          {...register("lastName")}
        />
      </div>

      <Input
        label="Email Address"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />

      <Input
        label="Phone Number"
        type="tel"
        placeholder="+234 800 000 0000"
        autoComplete="tel"
        hint="Optional — used for account security"
        error={errors.phone?.message}
        {...register("phone")}
      />

      <div>
        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="Create a strong password"
          autoComplete="new-password"
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
        {password && (
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-neutral-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                  style={{ width: `${strength.level}%` }}
                />
              </div>
              <span className="text-xs text-neutral-500 w-12">{strength.label}</span>
            </div>
          </div>
        )}
      </div>

      <Input
        label="Confirm Password"
        type={showPassword ? "text" : "password"}
        placeholder="Repeat your password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <div>
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 text-primary-800 border-neutral-300 rounded focus:ring-primary-800/30 mt-0.5 shrink-0"
            {...register("acceptTerms")}
          />
          <span className="text-sm text-neutral-600">
            I agree to the{" "}
            <Link href="/terms" className="text-primary-800 hover:underline">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-primary-800 hover:underline">Privacy Policy</Link>
          </span>
        </label>
        {errors.acceptTerms && (
          <p className="text-xs text-error mt-1">{errors.acceptTerms.message}</p>
        )}
      </div>

      <Button type="submit" variant="accent" size="lg" fullWidth loading={isLoading} className="mt-2">
        Create Account
      </Button>
    </form>
  );
}
