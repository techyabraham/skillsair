"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { formatDate } from "@/lib/utils";

interface Result {
  valid: boolean;
  message?: string;
  certificateCode?: string;
  issuedAt?: string;
  studentName?: string;
  courseTitle?: string;
  /** Final exam result band: "Passed" or "Passed with distinction". */
  result?: string | null;
}

/** Lets an employer check a SkillsAir certificate code (checked straight away when the page opens with one). */
export function CertificateVerifier({ initialCode = "" }: { initialCode?: string }) {
  const id = useId();
  const [code, setCode] = useState(initialCode);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  const check = useCallback(async (value: string) => {
    setLoading(true);
    const response = await fetch(`/api/certificates/verify/${encodeURIComponent(value.trim())}`).catch(() => null);
    const data = ((await response?.json().catch(() => null)) as Result | null) ?? { valid: false, message: "Verification is temporarily unavailable." };
    setResult(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (initialCode) void check(initialCode);
  }, [initialCode, check]);

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    await check(code);
  };

  return (
    <form onSubmit={verify} className="max-w-xl">
      <label htmlFor={`${id}-code`} className="label">Certificate code</label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input id={`${id}-code`} value={code} onChange={(event) => setCode(event.target.value)} placeholder="SAC-XXXXXXXX" className="input-field min-h-12 flex-1 text-base uppercase" />
        <button type="submit" disabled={loading || !code.trim()} className="min-h-12 rounded-xl bg-primary-800 px-6 font-semibold text-white hover:bg-primary-900 disabled:opacity-60">
          {loading ? "Checking…" : "Verify"}
        </button>
      </div>
      <div aria-live="polite" className="mt-4">
        {result &&
          (result.valid ? (
            <p className="rounded-xl bg-success-light p-4 text-success-dark">
              ✓ Valid certificate {result.certificateCode}: {result.studentName} completed {result.courseTitle}
              {result.issuedAt ? ` (issued ${formatDate(result.issuedAt)})` : ""}.
              {result.result ? ` Final exam: ${result.result}.` : ""}
            </p>
          ) : (
            <p className="rounded-xl bg-error-light p-4 text-error-dark">{result.message ?? "No certificate matches that code."}</p>
          ))}
      </div>
    </form>
  );
}
