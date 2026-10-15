import Image from "next/image";
import { isPlaceholder, site } from "@/content/site";

/** Founder face and one-line reason. Shows initials until the real photo is supplied. */
export function FounderCard({ quote = site.founder.quote }: { quote?: string }) {
  const photo = site.founder.photo;
  return (
    <figure className="flex items-start gap-4 rounded-2xl border border-neutral-200 bg-white p-5 md:p-6">
      {isPlaceholder(photo) ? (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-800 text-lg font-bold text-white" aria-hidden="true">
          AA
        </div>
      ) : (
        <Image src={photo} alt={site.founder.name} width={64} height={64} className="h-16 w-16 shrink-0 rounded-full object-cover" />
      )}
      <div>
        <blockquote className="text-neutral-700 leading-relaxed">&ldquo;{quote}&rdquo;</blockquote>
        <figcaption className="mt-3 text-sm font-semibold text-neutral-900">
          {site.founder.name}, {site.founder.title}
        </figcaption>
      </div>
    </figure>
  );
}
