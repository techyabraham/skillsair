import { cn } from "@/lib/utils";

interface SectionProps {
  id?: string;
  eyebrow?: string;
  title?: React.ReactNode;
  intro?: React.ReactNode;
  tone?: "white" | "muted" | "navy";
  className?: string;
  children?: React.ReactNode;
}

/** Consistent section rhythm (8-point grid, py-16 md:py-24) with one heading per section. */
export function Section({ id, eyebrow, title, intro, tone = "white", className, children }: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "py-16 md:py-24",
        tone === "muted" && "bg-neutral-50",
        tone === "navy" && "bg-navy text-white",
        tone === "white" && "bg-white",
        id && "scroll-mt-24",
        className,
      )}
    >
      <div className="container-wide">
        {(eyebrow || title || intro) && (
          <div className="max-w-3xl">
            {eyebrow && <p className={cn("text-sm font-semibold uppercase tracking-wider", tone === "navy" ? "text-accent-300" : "text-primary-800")}>{eyebrow}</p>}
            {title && <h2 className={cn("mt-2 text-[1.625rem] font-heading font-bold leading-tight md:text-[2.5rem]", tone === "navy" ? "text-white" : "text-neutral-900")}>{title}</h2>}
            {intro && <div className={cn("mt-4 text-base leading-relaxed md:text-lg", tone === "navy" ? "text-white/85" : "text-neutral-600")}>{intro}</div>}
          </div>
        )}
        {children && <div className={cn(title || intro ? "mt-10" : "")}>{children}</div>}
      </div>
    </section>
  );
}
