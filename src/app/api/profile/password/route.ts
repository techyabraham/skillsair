import { NextRequest, NextResponse } from "next/server";

const WP_API = process.env.NEXT_PUBLIC_WP_API || "https://api.skillsair.com/wp-json";
const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "https://api.skillsair.com/graphql";

function authHeader(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  return header?.startsWith("Bearer ") ? header : null;
}

async function verifyCurrentPassword(email: string, password: string): Promise<boolean> {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        mutation VerifyLogin($username: String!, $password: String!) {
          login(input: { clientMutationId: "skillsair-password-check", username: $username, password: $password }) {
            authToken
          }
        }
      `,
      variables: { username: email, password },
    }),
  });
  const data = await res.json().catch(() => ({}));
  return Boolean(res.ok && data.data?.login?.authToken);
}

export async function PATCH(req: NextRequest) {
  const authorization = authHeader(req);
  if (!authorization) {
    return NextResponse.json({ message: "You must be signed in to change your password" }, { status: 401 });
  }

  const { userId, email, currentPassword, newPassword } = await req.json();
  if (!userId || !email || !currentPassword || !newPassword) {
    return NextResponse.json({ message: "Missing password change details" }, { status: 400 });
  }

  const currentPasswordValid = await verifyCurrentPassword(email, currentPassword);
  if (!currentPasswordValid) {
    return NextResponse.json({ message: "Current password is incorrect" }, { status: 400 });
  }

  const res = await fetch(`${WP_API}/wp/v2/users/${userId}`, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password: newPassword }),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(
      { message: data.message || "Password change failed" },
      { status: res.status }
    );
  }

  return NextResponse.json({ success: true });
}
