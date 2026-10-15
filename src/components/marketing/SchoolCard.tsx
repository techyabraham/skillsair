import Link from "next/link";

interface SchoolCardProps {
  slug: string;
  name: string;
  oneLiner: string;
  programmeCount: number;
  scholarshipOpen: boolean;
}

/** No prices: the scholarship price is revealed only after Apply. */
export function SchoolCard({ slug, name, oneLiner, programmeCount, scholarshipOpen }: SchoolCardProps) {
  return (
    <Link
      href={`/schools/${slug}`}
      className="group flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-5 transition-colors hover:border-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-800"
    >
      {scholarshipOpen && (
        <span className="mb-3 inline-flex w-fit items-center rounded-full bg-accent-50 px-2.5 py-1 text-xs font-semibold text-accent-800">
          Scholarship open
        </span>
      )}
      <h3 className="text-lg font-heading font-bold text-neutral-900 group-hover:text-primary-800">{name}</h3>
      {oneLiner && <p className="mt-2 flex-1 text-sm text-neutral-600">{oneLiner}</p>}
      <p className="mt-4 flex items-center justify-between text-sm font-semibold text-primary-800">
        <span>
          {programmeCount} programme{programmeCount === 1 ? "" : "s"}
        </span>
        <span aria-hidden="true">Explore →</span>
      </p>
    </Link>
  );
}
