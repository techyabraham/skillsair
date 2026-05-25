import { NextRequest, NextResponse } from "next/server";

const WP_API = process.env.NEXT_PUBLIC_WP_API || "https://api.skillsair.com/wp-json";

interface ProfilePayload {
  id?: number;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  bio?: string;
  timezone?: string;
}

function authHeader(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  return header?.startsWith("Bearer ") ? header : null;
}

export async function PATCH(req: NextRequest) {
  const authorization = authHeader(req);
  if (!authorization) {
    return NextResponse.json({ message: "You must be signed in to update your profile" }, { status: 401 });
  }

  const body = (await req.json()) as ProfilePayload;
  if (!body.id) {
    return NextResponse.json({ message: "Missing user ID" }, { status: 400 });
  }

  const res = await fetch(`${WP_API}/wp/v2/users/${body.id}`, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      first_name: body.firstName,
      last_name: body.lastName,
      name: body.displayName,
      email: body.email,
      description: body.bio,
      meta: {
        phone: body.phone || "",
        timezone: body.timezone || "",
      },
    }),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(
      { message: data.message || "Profile update failed" },
      { status: res.status }
    );
  }

  return NextResponse.json({
    id: data.id ?? body.id,
    firstName: data.first_name ?? body.firstName ?? "",
    lastName: data.last_name ?? body.lastName ?? "",
    displayName: data.name ?? body.displayName ?? "",
    email: data.email ?? body.email ?? "",
    phone: data.meta?.phone ?? body.phone ?? "",
    bio: data.description?.raw ?? data.description ?? body.bio ?? "",
    timezone: data.meta?.timezone ?? body.timezone ?? "",
    avatar: data.avatar_urls?.["96"] || data.avatar_urls?.["48"] || "",
  });
}
