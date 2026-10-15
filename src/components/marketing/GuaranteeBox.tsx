import Link from "next/link";

export function GuaranteeBox() {
  return (
    <div className="rounded-2xl border border-success/30 bg-success-light/50 p-5">
      <h3 className="font-heading font-semibold text-neutral-900">Our fair refund promise</h3>
      <p className="mt-2 text-neutral-700">
        Try it first. Complete at least one chapter or 5 lessons. If it&apos;s not for you, ask for a refund within 24 hours of paying.{" "}
        <Link href="/refunds" className="font-medium text-primary-800 underline underline-offset-2">
          Refund policy
        </Link>
      </p>
    </div>
  );
}
