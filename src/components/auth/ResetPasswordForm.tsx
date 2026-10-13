"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!token) return setError("The password reset link is missing its token.");
    if (password !== confirmPassword) return setError("The passwords do not match.");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const result = await response.json().catch(() => ({})) as { error?: { message?: string }; message?: string };
      if (!response.ok) throw new Error(result.error?.message || result.message || "Password reset failed.");
      setComplete(true);
      window.setTimeout(() => router.replace("/login"), 1800);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Password reset failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-md space-y-4">
      <h1 className="text-2xl font-heading font-bold text-neutral-900">Set a new password</h1>
      {complete ? <p className="text-sm text-success-dark">Password reset. Taking you to sign in…</p> : null}
      {!complete && <>
        <Input label="New password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        <Input label="Confirm new password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
        <p className="text-xs text-neutral-500">Use at least 8 characters, including uppercase and lowercase letters, a number, and a symbol.</p>
        {error && <p role="alert" className="text-sm text-error">{error}</p>}
        <Button type="submit" variant="primary" fullWidth loading={loading}>Reset password</Button>
      </>}
    </form>
  );
}
