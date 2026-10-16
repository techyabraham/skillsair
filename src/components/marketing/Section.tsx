import { cn } from "@/lib/utils";

interface SectionProps {
  id?: string;
  eyebrow?: string;
  title?: React.ReactNode;
  intro?: React.ReactNode;
  tone?: "white" | "muted" | "navy";
  align?: "left" | "center";
  /** Narrow content column (design uses 820–900px for text-led sections). */
  narrow?: boolean;
  /** Use 1 for the page's main title section (one per page). */
  level?: 1 | 2;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Section rhythm from the design: 96px vertical padding, uppercase orange eyebrow, 40px
 * Space Grotesk heading in navy (white on navy), 18px slate intro.
 */
export function Section({ id, eyebrow, title, intro, tone = "white", align = "left", narrow = false, level = 2, className, children }: SectionProps) {
  const dark = tone === "navy";
  const Heading = level === 1 ? "h1" : "h2";
  return (
    <section
      id={id}
      className={cn(
        "py-16 md:py-24",
        tone === "muted" && "bg-neutral-50",
        dark && "bg-navy text-neutral-200",
        tone === "white" && "bg-white",
        id && "scroll-mt-24",
        className,
      )}
    >
      <div className={cn("container-wide", narrow && "max-w-[900px]", align === "center" && "flex flex-col items-center text-center")}>
        {(eyebrow || title || intro) && (
          <div className={cn("flex max-w-3xl flex-col gap-3", align === "center" && "items-center")}>
            {eyebrow && <p className={cn("eyebrow", dark && "text-accent-300")}>{eyebrow}</p>}
            {title && (
              <Heading
                className={cn(
                  "font-bold",
                  level === 1 ? "text-[2.125rem] leading-[1.06] tracking-[-0.02em] md:text-[3.5rem]" : "text-[1.75rem] leading-[1.15] md:text-[2.5rem]",
                  dark ? "text-white" : "text-navy",
                )}
              >
                {title}
              </Heading>
            )}
            {intro && <div className={cn("text-base leading-relaxed md:text-lg", dark ? "text-neutral-300" : "text-neutral-700")}>{intro}</div>}
          </div>
        )}
        {children && <div className={cn("w-full", title || intro ? "mt-10 md:mt-12" : "")}>{children}</div>}
      </div>
    </section>
  );
}
