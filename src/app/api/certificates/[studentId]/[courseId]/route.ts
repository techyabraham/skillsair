import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendPayload, backendToken } from "@/lib/backend-api";

interface CertificateRecord { pdfUrl?: string }
interface PayloadList { docs?: CertificateRecord[] }

export async function GET(req: NextRequest, { params }: { params: { studentId: string; courseId: string } }) {
  if (!backendToken(req)) return NextResponse.json({ message: "Sign in to access your certificate." }, { status: 401 });
  const query = new URLSearchParams({
    limit: "1",
    depth: "0",
    "where[student][equals]": params.studentId,
    "where[course][equals]": params.courseId,
  });
  const response = await backendFetch(req, `certificates?${query}`);
  if (!response.ok) return NextResponse.json({ message: "Certificate could not be loaded." }, { status: response.status });
  const payload = await backendPayload<PayloadList>(response);
  const pdfUrl = payload.docs?.[0]?.pdfUrl;
  if (!pdfUrl) return NextResponse.json({ message: "Certificate not found." }, { status: 404 });
  let target: URL;
  try { target = new URL(pdfUrl); } catch { return NextResponse.json({ message: "Certificate link is invalid." }, { status: 502 }); }
  if (target.protocol !== "https:") return NextResponse.json({ message: "Certificate link is invalid." }, { status: 502 });
  return NextResponse.redirect(target);
}
