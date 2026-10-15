import { getPublishedPage } from "@/lib/cms-pages";
import { RichText } from "@/components/marketing/RichText";
import { formatDate } from "@/lib/utils";
import { site } from "@/content/site";

/**
 * Admin-editable legal page (backend `pages` collection, by slug). Until a page is published
 * it shows a friendly holding message instead of a 404.
 */
export async function LegalPage({ slug, fallbackTitle }: { slug: string; fallbackTitle: string }) {
  const result = await getPublishedPage(slug);
  return (
    <article className="container-narrow py-12 md:py-16">
      <h1 className="text-[2rem] font-heading font-extrabold text-neutral-900 md:text-[2.5rem]">
        {result.status === "published" ? result.page.title : fallbackTitle}
      </h1>
      {result.status === "published" ? (
        <>
          <p className="mt-2 text-sm text-neutral-500">Last updated {formatDate(result.page.updatedAt)}</p>
          <div className="mt-8 max-w-3xl">
            <RichText root={result.page.content?.root} />
          </div>
        </>
      ) : (
        <p className="mt-6 max-w-2xl rounded-2xl border border-neutral-200 bg-neutral-50 p-6 text-neutral-700">
          This page is being updated. Email{" "}
          <a href={`mailto:${site.supportEmail}`} className="font-medium text-primary-800 underline">{site.supportEmail}</a> for a copy.
        </p>
      )}
    </article>
  );
}
