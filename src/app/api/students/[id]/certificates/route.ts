import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendPayload } from "@/lib/backend-api";
import type { Certificate } from "@/types/course";

interface CertificateRecord {
  id: number;
  certificateCode?: string;
  pdfUrl?: string;
  issuedAt?: string;
  course?: { id?: number; slug?: string; title?: string; thumbnail?: { url?: string } } | number;
  student?: { firstName?: string; lastName?: string } | number;
}

interface PayloadList { docs?: CertificateRecord[] }

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const query = new URLSearchParams({ depth: "2", limit: "1000", sort: "-issuedAt", "where[student][equals]": params.id });
  const response = await backendFetch(req, `certificates?${query}`);
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    return NextResponse.json({ message: body?.error?.message || "Unable to load certificates." }, { status: response.status });
  }
  const payload = await backendPayload<PayloadList>(response);
  const certificates: Certificate[] = (payload.docs || []).map((item) => {
    const course = typeof item.course === "object" && item.course ? item.course : {};
    const student = typeof item.student === "object" && item.student ? item.student : {};
    return {
      id: String(item.id),
      courseId: Number(course.id || 0),
      courseSlug: course.slug || "",
      courseName: course.title || "Course certificate",
      courseThumbnail: course.thumbnail?.url || "",
      studentName: `${student.firstName || ""} ${student.lastName || ""}`.trim(),
      issuedAt: item.issuedAt || "",
      certificateUrl: item.pdfUrl || "",
      verificationCode: item.certificateCode || "",
    };
  });
  return NextResponse.json(certificates);
}
