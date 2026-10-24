import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-api";

interface Verification {
  valid: boolean;
  certificateCode: string;
  issuedAt: string;
  studentName?: string;
  courseTitle?: string;
  result?: string | null;
}

/** Public certificate check for employers. */
export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const code = params.code.trim().toUpperCase();
  if (!/^SAC-[A-Z0-9]{8}$/.test(code)) return NextResponse.json({ valid: false, message: "Certificate codes look like SAC-XXXXXXXX." }, { status: 400 });
  const upstream = await backendFetch(req, `certificates/verify/${encodeURIComponent(code)}`).catch(() => null);
  if (!upstream) return NextResponse.json({ valid: false, message: "Verification is temporarily unavailable." }, { status: 502 });
  if (upstream.status === 404) return NextResponse.json({ valid: false, message: "No certificate matches that code." }, { status: 404 });
  const payload = (await upstream.json().catch(() => null)) as { data?: Verification } | null;
  if (!upstream.ok || !payload?.data) return NextResponse.json({ valid: false, message: "Verification is temporarily unavailable." }, { status: 502 });
  return NextResponse.json(payload.data);
}
