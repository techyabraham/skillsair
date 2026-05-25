import { NextRequest, NextResponse } from "next/server";

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "https://api.skillsair.com/graphql";

const RESET_MUTATION = `
  mutation SendPasswordResetEmail($username: String!) {
    sendPasswordResetEmail(
      input: {
        clientMutationId: "skillsair-reset"
        username: $username
      }
    ) {
      user {
        email
      }
    }
  }
`;

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ message: "Enter a valid email address" }, { status: 400 });
  }

  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query: RESET_MUTATION,
      variables: { username: email },
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ message: "Password reset is unavailable right now" }, { status: res.status });
  }

  return NextResponse.json({ success: true });
}
