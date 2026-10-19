/** Shown beside the name fields wherever an account is created: the certificate uses this name. */
export function CertificateNameNotice({ id }: { id?: string }) {
  return (
    <div id={id} className="flex items-start gap-3 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-neutral-800">
      <svg viewBox="0 0 24 24" aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-accent-700" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="9" r="5.5" />
        <path d="m9 13.6-1.5 7.4L12 18.6l4.5 2.4-1.5-7.4" />
      </svg>
      <p>
        <strong className="font-semibold text-navy">Important:</strong> your name will appear on your certificate exactly as you enter it here. Use your full name and check the spelling.
      </p>
    </div>
  );
}
