import { cn } from "@/lib/utils";

/** Line icons for the ten schools (24px grid, stroke = currentColor), matched by school name. */
const PATHS: Record<string, React.ReactNode> = {
  ai: (
    <>
      <path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />
      <path d="m18.5 15 .8 2 2 .7-2 .8-.8 2-.7-2-2-.8 2-.7.7-2Z" />
    </>
  ),
  contentcreation: (
    <>
      <rect x="3" y="6" width="13" height="12" rx="2.5" />
      <path d="m16 10.5 5-3v9l-5-3" />
    </>
  ),
  data: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M21 20H3" />
    </>
  ),
  design: (
    <>
      <path d="M4 20c1.5-4.5 4-8 8-11l3 3c-3 4-6.5 6.5-11 8Z" />
      <path d="m15 9 2.5-2.5a2.1 2.1 0 0 1 3 3L18 12" />
    </>
  ),
  engineering: (
    <>
      <path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />
    </>
  ),
  nocodedevelopment: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <path d="M17.25 13.5v7.5M13.5 17.25H21" />
    </>
  ),
  products: (
    <>
      <path d="M12 3 3 7.5 12 12l9-4.5L12 3Z" />
      <path d="M3 12l9 4.5 9-4.5M3 16.5 12 21l9-4.5" />
    </>
  ),
  salesandmarketing: (
    <>
      <path d="M3 10v4h3l7 4V6L6 10H3Z" />
      <path d="M17 9a4 4 0 0 1 0 6M19.5 6.5a7.5 7.5 0 0 1 0 11" />
    </>
  ),
  security: (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.5 3.2 8.2 7.5 9.5 4.3-1.3 7.5-5 7.5-9.5V6L12 3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  smartphonecreators: (
    <>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <path d="M10.5 18.5h3" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
};

export function schoolIconKey(name: string): string {
  return name.toLowerCase().replace(/^school of /, "").replace(/[^a-z]/g, "");
}

/** "School of Data" → "Data"; used where space is tight. */
export function shortSchoolName(name: string): string {
  return name.replace(/^School of /i, "");
}

export function SchoolIcon({ name, className }: { name: string; className?: string }) {
  const paths = PATHS[schoolIconKey(name)] ?? PATHS.engineering;
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={cn("h-6 w-6", className)}>
      {paths}
    </svg>
  );
}
