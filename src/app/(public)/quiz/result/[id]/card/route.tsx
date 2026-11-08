import { ImageResponse } from "next/og";
import { careers, isCareerId, matchLabel } from "@/content/quiz-v2";
import { getQuizResult } from "@/lib/quiz-result";

/**
 * 1080 × 1350 share card for a Career Match result: logo (icon + wordmark), first name, top
 * match with its ring, the top 3 as bars and skillsair.com/quiz. No email or phone number.
 * Also the static image in the result email. Edge runtime, like the programme share images
 * (next/og on the Node runtime can't load its bundled font on Windows dev machines).
 */
export const runtime = "edge";

const NAVY = "#0d1b4b";
const ORANGE = "#f97316";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  // Results never change, so the card can be cached for a day.
  const lookup = await getQuizResult(params.id, undefined, 86_400);
  if (lookup.status !== "ok") return new Response("Not found", { status: lookup.status === "not_found" ? 404 : 502 });
  const { result } = lookup;
  const scores = result.scores.filter((score) => isCareerId(score.career)).slice(0, 3) as Array<{ career: keyof typeof careers; percent: number }>;
  const top = scores[0];
  if (!top) return new Response("Not found", { status: 404 });
  const name = result.firstName.trim().split(/\s+/)[0] ?? "";
  const percent = Math.max(0, Math.min(100, Math.round(top.percent)));
  const size = 360;
  const stroke = 30;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: NAVY, color: "#fff", padding: 80, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 48, fontWeight: 700 }}>
          <svg width="56" height="56" viewBox="0 0 512 512">
            <rect x="8" y="58" width="498" height="92" rx="30" fill="#339900" />
            <rect x="8" y="208" width="498" height="92" rx="30" fill="#FFD600" />
            <rect x="8" y="357" width="498" height="92" rx="30" fill="#D50000" />
          </svg>
          <div style={{ display: "flex" }}>
            Skills<span style={{ color: ORANGE }}>Air</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 70 }}>
          <div style={{ fontSize: 40, color: "#fed7aa" }}>{name ? `${name}'s Career Match` : "My Career Match"}</div>
          <div style={{ fontSize: careers[top.career].name.length > 24 ? 76 : 92, fontWeight: 800, lineHeight: 1.05, marginTop: 16, letterSpacing: -2 }}>{careers[top.career].name}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 56, marginTop: "auto" }}>
          <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}>
              <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={stroke} />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={ORANGE}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={`${circumference * (1 - percent / 100)}`}
              />
            </svg>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontSize: 96, fontWeight: 800 }}>{`${percent}%`}</div>
              <div style={{ fontSize: 30, color: "#fed7aa" }}>{matchLabel(percent)}</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 34, flex: 1 }}>
            {scores.map((score) => (
              <div key={score.career} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 32 }}>
                  <span>{careers[score.career].name}</span>
                  <span style={{ fontWeight: 700 }}>{`${Math.round(score.percent)}%`}</span>
                </div>
                <div style={{ display: "flex", height: 20, borderRadius: 10, background: "rgba(255,255,255,0.15)" }}>
                  <div style={{ width: `${Math.max(2, Math.min(100, score.percent))}%`, height: 20, borderRadius: 10, background: score.career === top.career ? ORANGE : "#ffffff" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "auto", fontSize: 34 }}>
          <div style={{ display: "flex", color: "rgba(255,255,255,0.75)" }}>Find your match in 3 minutes</div>
          <div style={{ display: "flex", fontWeight: 700, color: ORANGE }}>skillsair.com/quiz</div>
        </div>
      </div>
    ),
    { width: 1080, height: 1350, headers: { "Cache-Control": "public, max-age=86400" } },
  );
}
