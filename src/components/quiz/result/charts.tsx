import { TRAIT_IDS, TRAIT_LABELS, type TraitId } from "@/content/quiz-v2";

/**
 * Hand-built SVG charts for the quiz result (no chart library: many visitors are on limited
 * data). Each is aria-hidden with a text equivalent beside it. The ring fills with a CSS
 * animation that is switched off under prefers-reduced-motion.
 */

const RING_STYLES = `
@keyframes sa-ring-fill { from { stroke-dashoffset: var(--sa-ring-c); } }
.sa-ring-arc { animation: sa-ring-fill 1.2s cubic-bezier(.2,.8,.2,1) both; }
@media (prefers-reduced-motion: reduce) { .sa-ring-arc { animation: none; } }
`;

export function MatchRing({ percent, label, size = 168 }: { percent: number; label: string; size?: number }) {
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, percent)) / 100);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <style>{RING_STYLES}</style>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={stroke} />
        <circle
          className="sa-ring-arc"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f97316"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ ["--sa-ring-c" as string]: `${circumference}` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center" aria-hidden="true">
        <span className="font-heading text-4xl font-extrabold leading-none text-white">{percent}%</span>
        <span className="mt-1 max-w-[7rem] text-xs font-semibold uppercase tracking-wider text-orange-200">{label}</span>
      </div>
    </div>
  );
}

/** 5-axis radar of the trait scores (0–100). */
export function TraitRadar({ traits, size = 260 }: { traits: Record<TraitId, number>; size?: number }) {
  const centre = size / 2;
  const radius = size / 2 - 44;
  const point = (index: number, value: number) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / TRAIT_IDS.length;
    return [centre + Math.cos(angle) * radius * value, centre + Math.sin(angle) * radius * value] as const;
  };
  const polygon = (value: (index: number) => number) => TRAIT_IDS.map((_, index) => point(index, value(index)).join(",")).join(" ");
  const shape = polygon((index) => Math.max(0.04, traits[TRAIT_IDS[index]!] / 100));
  return (
    <svg viewBox={`-56 -8 ${size + 112} ${size + 16}`} className="h-auto w-full max-w-[320px]" aria-hidden="true">
      {[0.25, 0.5, 0.75, 1].map((ring) => (
        <polygon key={ring} points={polygon(() => ring)} fill="none" stroke="#e5e7eb" strokeWidth={1} />
      ))}
      {TRAIT_IDS.map((_, index) => {
        const [x, y] = point(index, 1);
        return <line key={index} x1={centre} y1={centre} x2={x} y2={y} stroke="#e5e7eb" strokeWidth={1} />;
      })}
      <polygon points={shape} fill="rgba(13,27,75,0.18)" stroke="#0d1b4b" strokeWidth={2.5} strokeLinejoin="round" />
      {TRAIT_IDS.map((trait, index) => {
        const [x, y] = point(index, Math.max(0.04, traits[trait] / 100));
        return <circle key={trait} cx={x} cy={y} r={4} fill="#0d1b4b" />;
      })}
      {TRAIT_IDS.map((trait, index) => {
        const [x, y] = point(index, 1.2);
        const anchor = Math.abs(x - centre) < 4 ? "middle" : x > centre ? "start" : "end";
        const name = TRAIT_LABELS[trait].name === "People & Strategy" ? "People" : TRAIT_LABELS[trait].name;
        return (
          <text key={trait} x={x} y={y} textAnchor={anchor} dominantBaseline="middle" fontSize={12} fontWeight={600} fill="#374151">
            {name}
          </text>
        );
      })}
    </svg>
  );
}
