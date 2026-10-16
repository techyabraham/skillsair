/**
 * Hero background from the design: an adire-inspired tile (concentric circles, dashed ties,
 * a small orange centre), faded out towards the centre so the text stays readable.
 */
export function AdirePattern({ opacity = 0.55 }: { opacity?: number }) {
  return (
    <svg aria-hidden="true" width="100%" height="100%" className="pointer-events-none absolute inset-0" style={{ opacity }}>
      <defs>
        <pattern id="adire" width="96" height="96" patternUnits="userSpaceOnUse">
          <circle cx="48" cy="48" r="11" fill="none" stroke="#3b5bb5" strokeWidth="1.4" />
          <circle cx="48" cy="48" r="20" fill="none" stroke="#3b5bb5" strokeWidth="1.4" strokeDasharray="3 4" />
          <circle cx="48" cy="48" r="3" fill="#3b5bb5" />
          <circle cx="0" cy="0" r="2.5" fill="#3b5bb5" />
          <circle cx="96" cy="0" r="2.5" fill="#3b5bb5" />
          <circle cx="0" cy="96" r="2.5" fill="#3b5bb5" />
          <circle cx="96" cy="96" r="2.5" fill="#3b5bb5" />
          <path d="M0 48h14M82 48h14M48 0v14M48 82v14" fill="none" stroke="#3b5bb5" strokeWidth="1.4" strokeDasharray="2 3" />
          <path d="M14 14l8 8M82 14l-8 8M14 82l8-8M82 82l-8-8" fill="none" stroke="#3b5bb5" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="48" cy="48" r="1.6" fill="#f97316" />
        </pattern>
        <radialGradient id="adireFade" cx="50%" cy="46%" r="62%">
          <stop offset="0" stopColor="#000000" />
          <stop offset="0.38" stopColor="#000000" />
          <stop offset="1" stopColor="#ffffff" />
        </radialGradient>
        <mask id="adireMask">
          <rect width="100%" height="100%" fill="url(#adireFade)" />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="url(#adire)" mask="url(#adireMask)" />
    </svg>
  );
}
