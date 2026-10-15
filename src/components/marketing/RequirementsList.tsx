import Link from "next/link";

interface RequirementsListProps {
  requirements: string[];
  phoneFriendly: boolean;
  /** Set when the applicant said they only have a phone and this programme needs a laptop. */
  phoneOnlyWarning?: boolean;
  alternatives?: Array<{ title: string; slug: string }>;
  alternativeHref?: (slug: string) => string;
}

/** What you'll need. Always shown, so nobody pays for a programme their device can't run. */
export function RequirementsList({
  requirements,
  phoneFriendly,
  phoneOnlyWarning = false,
  alternatives = [],
  alternativeHref = (slug) => `/apply?programme=${encodeURIComponent(slug)}`,
}: RequirementsListProps) {
  return (
    <div>
      {phoneFriendly && (
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-success-light px-3 py-1 text-sm font-semibold text-success-dark">
          📱 Phone-friendly
        </p>
      )}
      {requirements.length ? (
        <ul className="space-y-2">
          {requirements.map((requirement) => (
            <li key={requirement} className="flex items-start gap-2 text-neutral-700">
              <span className="mt-1 text-primary-800" aria-hidden="true">•</span>
              {requirement}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-neutral-600">Start on your phone or laptop. Ask us on WhatsApp if you&apos;re unsure what you&apos;ll need.</p>
      )}
      {phoneOnlyWarning && !phoneFriendly && (
        <div className="mt-4 rounded-xl border border-warning/40 bg-warning-light p-4 text-neutral-800">
          <p>
            <strong>Heads up:</strong> this programme needs a laptop. If you only have a phone right now, these programmes work fully on a phone:
          </p>
          {alternatives.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-2">
              {alternatives.map((item) => (
                <li key={item.slug}>
                  <Link href={alternativeHref(item.slug)} className="inline-flex min-h-10 items-center rounded-full border border-neutral-300 bg-white px-3 text-sm font-medium text-primary-800 hover:border-primary-800">
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
