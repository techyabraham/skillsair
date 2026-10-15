/**
 * "Step 2 of 3" with a bar that starts partly filled (endowed progress), so applicants
 * feel they have already begun.
 */
export function ProgressSteps({ step, total }: { step: number; total: number }) {
  const percent = Math.round(((step - 0.5) / total) * 100);
  return (
    <div className="mb-6">
      <p className="mb-2 text-sm font-medium text-neutral-600" aria-live="polite">
        Step {step} of {total}
      </p>
      <div
        className="h-2 overflow-hidden rounded-full bg-neutral-200"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={`Application progress: step ${step} of ${total}`}
      >
        <div className="h-full rounded-full bg-accent-700 transition-[width] duration-200" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
