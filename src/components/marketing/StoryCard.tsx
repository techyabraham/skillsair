import Image from "next/image";
import type { ProofStory } from "@/content/proof";

/** Rendered only for stories with `verified: true` and the learner's consent on file. */
export function StoryCard({ story }: { story: ProofStory }) {
  if (!story.verified || !story.consentOnFile) return null;
  return (
    <figure className="rounded-2xl border border-neutral-200 bg-white p-6">
      <blockquote className="text-neutral-700 leading-relaxed">&ldquo;{story.quote}&rdquo;</blockquote>
      <figcaption className="mt-4 flex items-center gap-3">
        {story.photo && <Image src={story.photo} alt="" width={48} height={48} className="h-12 w-12 rounded-full object-cover" />}
        <span>
          <span className="block font-semibold text-neutral-900">{story.name}</span>
          <span className="block text-sm text-neutral-600">
            {story.programme} · {story.outcome}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}
