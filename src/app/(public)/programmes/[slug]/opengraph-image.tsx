import { ImageResponse } from "next/og";
import { getProgramme } from "@/lib/programme";
import { site } from "@/content/site";

// Generated share image for each programme page (1200 × 630), refreshed with the page. Edge runtime:
// next/og on the Node runtime cannot load its bundled font on Windows dev machines (Next 14).
export const runtime = "edge";
export const revalidate = 3600;
export const alt = "SkillsAir programme";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ProgrammeOgImage({ params }: { params: { slug: string } }) {
  const result = await getProgramme(params.slug);
  const title = result.status === "ok" ? result.programme.course.title : "SkillsAir";
  const school = result.status === "ok" ? result.programme.school?.name ?? "" : "";
  const facts = result.status === "ok" ? [site.programme.format, `~${result.programme.weeklyHours} hrs a week`, "Verifiable certificate"] : ["Job-ready tech skills"];

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#0d1b4b", color: "#FFFFFF", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, fontWeight: 700 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#f97316" }} />
          SkillsAir
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {school ? <div style={{ fontSize: 28, color: "#fdba74" }}>{school}</div> : null}
          <div style={{ fontSize: title.length > 40 ? 64 : 80, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>{title}</div>
        </div>
        <div style={{ display: "flex", gap: 14, fontSize: 26 }}>
          {facts.map((fact) => (
            <div key={fact} style={{ padding: "10px 20px", borderRadius: 999, border: "2px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.08)" }}>
              {fact}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
