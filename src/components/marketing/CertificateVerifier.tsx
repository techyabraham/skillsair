"use client";

import { useId, useState } from "react";
import { formatDate } from "@/lib/utils";

interface Result {
  valid: boolean;
  message?: string;
  certificateCode?: string;
  issuedAt?: string;
  studentName?: string;
  courseTitle?: string;
}

/** Lets an employer check a SkillsAir certificate code. */
export function CertificateVerifier() {
  const id = useId();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const response = await fetch(`/api/certificates/verify/${encodeURIComponent(code.trim())}`).catch(() => null);
    const data = ((await response?.json().catch(() => null)) as Result | null) ?? { valid: false, message: "Verification is temporarily unavailable." };
    setResult(data);
    setLoading(false);
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
            </p>
          ) : (
            <p className="rounded-xl bg-error-light p-4 text-error-dark">{result.message ?? "No certificate matches that code."}</p>
          ))}
      </div>
    </form>
  );
}
