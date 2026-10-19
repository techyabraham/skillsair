"use client";

import React, { useState } from "react";
import { CertificateNameNotice } from "@/components/auth/CertificateNameNotice";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@/lib/zodResolver";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ConsentCheckbox } from "@/components/marketing/ConsentCheckbox";
import { normalizePhone, PHONE_ERROR } from "@/lib/phone";
import { safeNextPath } from "@/lib/lead-session";
import { track } from "@/lib/analytics";
import { MARKETING_CONSENT_TEXT } from "@/content/site";

const PASSWORD_RULES: Array<{ label: string; test: (value: string) => boolean }> = [
  { label: "8+ characters", test: (value) => value.length >= 8 },
  { label: "An uppercase letter", test: (value) => /[A-Z]/.test(value) },
  { label: "A lowercase letter", test: (value) => /[a-z]/.test(value) },
  { label: "A number", test: (value) => /[0-9]/.test(value) },
  { label: "A symbol", test: (value) => /[^A-Za-z0-9]/.test(value) },
];

const registerSchema = z.object({
  firstName: z.string().trim().min(1, "Tell us your first name"),
  lastName: z.string().trim().min(1, "Add your last name as it should appear on your certificate"),
  email: z.string().email("That email doesn't look right. Check for a typo?"),
  phone: z.string().refine((value) => Boolean(normalizePhone(value)), PHONE_ERROR),
  password: z.string().refine((value) => PASSWORD_RULES.every((rule) => rule.test(value)), "Your password needs every item on the checklist"),
  acceptTerms: z.boolean().refine((value) => value, "Please agree to the Terms and Privacy Notice"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register: registerUser, error: authError, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

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

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: normalizePhone(data.phone) ?? data.phone,
        password: data.password,
        acceptTerms: data.acceptTerms,
        marketingConsent,
        marketingConsentText: marketingConsent ? MARKETING_CONSENT_TEXT : undefined,
      });
      track("account_created", { source: "register" });
      router.push(safeNextPath(searchParams.get("next")));
    } catch {
      // Error shown via authError
    }
  };

  const nextParam = searchParams.get("next");

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {authError && (
        <div className="p-3.5 rounded-xl bg-error-light border border-error/20 text-sm text-error-dark" role="alert">
          {authError}
          {/already exists/i.test(authError) && (
            <>
              {" "}
              <Link href={`/login${nextParam ? `?next=${encodeURIComponent(safeNextPath(nextParam))}` : ""}`} className="font-semibold underline">
                Log in instead
              </Link>
            </>
          )}
        </div>
      )}

      <CertificateNameNotice />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="First name" placeholder="e.g. Tobi" autoComplete="given-name" error={errors.firstName?.message} {...register("firstName")} />
        <Input label="Last name" placeholder="As on your certificate" autoComplete="family-name" error={errors.lastName?.message} {...register("lastName")} />
      </div>

      <Input label="Email" type="email" placeholder="you@example.com" autoComplete="email" error={errors.email?.message} {...register("email")} />

      <Input
        label="WhatsApp number"
        type="tel"
        inputMode="tel"
        placeholder="0818 000 0000"
        autoComplete="tel"
        hint="We use it for payment help and important updates about your programme."
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
          rightIcon={<span className="text-xs font-medium">{showPassword ? "Hide" : "Show"}</span>}
          onRightIconClick={() => setShowPassword((v) => !v)}
          {...register("password")}
        />
        <ul className="mt-2 grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
          {PASSWORD_RULES.map((rule) => {
            const met = rule.test(password);
            return (
              <li key={rule.label} className={met ? "text-success-dark" : "text-neutral-500"}>
                <span aria-hidden="true">{met ? "✓" : "○"}</span> {rule.label}
                <span className="sr-only">{met ? " (done)" : " (not yet)"}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <ConsentCheckbox checked={marketingConsent} onChange={setMarketingConsent} id="register-consent" />

      <div>
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input type="checkbox" className="w-5 h-5 text-primary-800 border-neutral-300 rounded mt-0.5 shrink-0" {...register("acceptTerms")} />
          <span className="text-sm text-neutral-600">
            I agree to the{" "}
            <Link href="/terms" className="text-primary-800 underline">Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-primary-800 underline">Privacy Notice</Link>
          </span>
        </label>
        {errors.acceptTerms && <p className="text-xs text-error mt-1">{errors.acceptTerms.message}</p>}
      </div>

      <Button type="submit" variant="accent" size="lg" fullWidth loading={isLoading} className="mt-2 min-h-12">
        Create account
      </Button>
    </form>
  );
}
