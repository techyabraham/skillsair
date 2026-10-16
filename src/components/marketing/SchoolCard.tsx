import Link from "next/link";

interface SchoolCardProps {
  slug: string;
  name: string;
  oneLiner: string;
  programmeCount: number;
  scholarshipOpen: boolean;
}

/** Design: white card, 16px radius, green "Scholarship open" pill, orange "Explore →". No prices. */
export function SchoolCard({ slug, name, oneLiner, programmeCount, scholarshipOpen }: SchoolCardProps) {
  return (
    <Link
      href={`/schools/${slug}`}
      className="group flex h-full flex-col gap-2.5 rounded-2xl border border-neutral-200 bg-white p-[22px] text-neutral-900 transition-colors hover:border-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-800"
    >
      {scholarshipOpen && programmeCount > 0 && (
        <span className="self-start rounded-full bg-success-light px-2.5 py-0.5 text-xs font-semibold text-success-dark">Scholarship open</span>
      )}
      <span className="text-[17px] font-bold text-navy">{name}</span>
      {oneLiner && <span className="text-sm leading-normal text-neutral-600">{oneLiner}</span>}
      <span className="mt-auto flex items-center justify-between pt-1 text-sm font-semibold">
        <span className="text-accent-700">Explore →</span>
        <span className="font-medium text-neutral-600">
          {programmeCount > 0 ? `${programmeCount} programme${programmeCount === 1 ? "" : "s"}` : "Coming soon"}
        </span>
      </span>
    </Link>
  );
}
