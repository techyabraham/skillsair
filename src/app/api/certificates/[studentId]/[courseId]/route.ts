import { NextRequest, NextResponse } from "next/server";
import { normalizeCourseSlug, tutorHeaders, tutorUrl, wcHeaders, wcUrl } from "@/lib/server-course-catalog";

interface WcOrder {
  meta_data?: Array<{ key: string; value: unknown }>;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function progress(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value.replace("%", "")) || 0;
  return 0;
}

function metaValue(order: WcOrder, key: string): string {
  const value = order.meta_data?.find((meta) => meta.key === key)?.value;
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

async function hasPurchasedCertificate(studentId: number, courseSlug: string): Promise<boolean> {
  const res = await fetch(wcUrl("/orders", {
    customer: String(studentId),
    status: "completed",
    per_page: "100",
  }), {
    headers: wcHeaders(),
    cache: "no-store",
  });
  const orders = await res.json().catch(() => []);
  if (!Array.isArray(orders)) return false;
  const normalizedSlug = normalizeCourseSlug(courseSlug);

  return (orders as WcOrder[]).some((order) =>
    metaValue(order, "_skillsair_order_type") === "certificate" &&
    normalizeCourseSlug(metaValue(order, "_skillsair_certificate_course_slug")) === normalizedSlug
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { studentId: string; courseId: string } }
) {
  const studentId = Number(params.studentId);
  const courseId = Number(params.courseId);
  if (!Number.isFinite(studentId) || !Number.isFinite(courseId)) {
    return NextResponse.json({ message: "Invalid certificate" }, { status: 400 });
  }

  const res = await fetch(tutorUrl(`/students/${studentId}/courses`), {
    headers: tutorHeaders(),
    cache: "no-store",
  });
  const payload = await res.json().catch(() => ({}));
  const courses = Array.isArray(payload.data?.enrolled_courses) ? payload.data.enrolled_courses : [];
  const course = courses.find((item: Record<string, unknown>) => Number(item.ID || item.id || item.course_id) === courseId);
  if (!course || progress(course.course_completed_percentage) < 100) {
    return NextResponse.json({ message: "Certificate not found" }, { status: 404 });
  }

  const courseSlug = String(course.post_name || course.slug || "");
  if (!(await hasPurchasedCertificate(studentId, courseSlug))) {
    return NextResponse.json({ message: "Certificate has not been purchased" }, { status: 403 });
  }

  const courseName = escapeHtml(String(course.post_title || course.title || "Course"));
  const issuedAt = new Date(String(course.post_modified || course.post_date || Date.now())).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const verificationCode = `SA-${studentId}-${courseId}`;

  return new NextResponse(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>SkillsAir Certificate - ${courseName}</title>
    <style>
      body { margin: 0; font-family: Inter, Arial, sans-serif; background: #f5f6f8; color: #111827; }
      .page { min-height: 100vh; display: grid; place-items: center; padding: 32px; }
      .certificate { width: min(960px, 100%); background: white; border: 12px solid #0f3d3e; padding: 56px; text-align: center; box-shadow: 0 24px 80px rgba(15, 61, 62, .14); }
      .eyebrow { color: #f97316; text-transform: uppercase; letter-spacing: .18em; font-size: 13px; font-weight: 700; }
      h1 { margin: 16px 0 8px; font-size: 42px; color: #0f3d3e; }
      .copy { font-size: 18px; color: #4b5563; }
      .course { margin: 28px auto; font-size: 32px; font-weight: 800; max-width: 760px; }
      .meta { display: flex; justify-content: center; gap: 32px; flex-wrap: wrap; margin-top: 40px; color: #4b5563; font-size: 14px; }
      .meta strong { display: block; color: #111827; margin-top: 4px; }
      .actions { margin-top: 28px; }
      button { border: 0; background: #f97316; color: white; padding: 12px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; }
      @media print { body { background: white; } .page { padding: 0; } .certificate { box-shadow: none; width: auto; min-height: 70vh; } .actions { display: none; } }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="certificate">
        <div class="eyebrow">SkillsAir</div>
        <h1>Certificate of Completion</h1>
        <p class="copy">This certifies that the learner has successfully completed</p>
        <div class="course">${courseName}</div>
        <div class="meta">
          <div>Issued On<strong>${issuedAt}</strong></div>
          <div>Certificate ID<strong>${verificationCode}</strong></div>
        </div>
        <div class="actions"><button onclick="window.print()">Download / Print PDF</button></div>
      </section>
    </main>
  </body>
</html>`, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
