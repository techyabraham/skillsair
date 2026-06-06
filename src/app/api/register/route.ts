import { NextRequest, NextResponse } from "next/server";

const WC_API = `${(process.env.NEXT_PUBLIC_WP_API || "https://api.skillsair.com/wp-json").replace(/\/$/, "")}/wc/v3`;
const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "https://api.skillsair.com/graphql";
const WP_ORIGIN = new URL(process.env.NEXT_PUBLIC_WP_API || "https://api.skillsair.com/wp-json").origin;
const WC_KEY = process.env.WC_CONSUMER_KEY!;
const WC_SECRET = process.env.WC_CONSUMER_SECRET!;

const REGISTER_USER_MUTATION = `
  mutation RegisterUser(
    $username: String!
    $email: String!
    $password: String!
    $firstName: String!
    $lastName: String!
  ) {
    registerUser(
      input: {
        clientMutationId: "skillsair-register"
        username: $username
        email: $email
        password: $password
        firstName: $firstName
        lastName: $lastName
      }
    ) {
      user {
        databaseId
        email
      }
    }
  }
`;

function wcUrl(path: string): string {
  return `${WC_API}${path}`;
}

function wcHeaders(contentType: "json" | "form" = "json"): HeadersInit {
  return {
    Authorization: `Basic ${Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64")}`,
    "Content-Type": contentType === "json" ? "application/json" : "application/x-www-form-urlencoded",
    Accept: "application/json",
    "User-Agent": "SkillsAir-NextJS/1.0",
  };
}

async function safeJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { message: text.slice(0, 300) };
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 45_000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function registerViaGraphql(input: {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  const res = await fetchWithTimeout(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query: REGISTER_USER_MUTATION,
      variables: input,
    }),
  });
  const data = await safeJson(res);
  const errors = data.errors;
  const message = Array.isArray(errors) ? (errors[0] as { message?: string } | undefined)?.message : undefined;

  const graphData = data.data as
    | { registerUser?: { user?: { databaseId: number; email: string } } }
    | undefined;

  if (!res.ok || message || !graphData?.registerUser?.user) {
    throw new Error(message || "Registration failed");
  }

  return graphData.registerUser.user;
}

async function getHoneypotFields(): Promise<Record<string, string>> {
  try {
    const res = await fetchWithTimeout(`${WP_ORIGIN}/wp-login.php?action=register`, {
      headers: {
        Accept: "text/html",
        "User-Agent": "SkillsAir-NextJS/1.0",
      },
    });
    const html = await res.text();
    const match = html.match(/wpa_field_info\s*=\s*(\{[^\n<]+\})/);
    if (!match) return {};
    const info = JSON.parse(match[1]) as {
      wpa_field_name?: unknown;
      wpa_field_value?: unknown;
    };
    if (typeof info.wpa_field_name !== "string" || !info.wpa_field_name) return {};
    return {
      wpa_initiator: "",
      alt_s: "",
      [info.wpa_field_name]: String(info.wpa_field_value ?? ""),
    };
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone : "";

  if (!email || !password || !firstName || !lastName) {
    return NextResponse.json({ message: "All fields are required" }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: "Enter a valid email address" }, { status: 400 });
  }

  const username = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "") + Math.floor(Math.random() * 1000);

  let res: Response;
  try {
    const form = new URLSearchParams({
      email,
      username,
      password,
      first_name: firstName,
      last_name: lastName,
      ...(await getHoneypotFields()),
    });
    form.set("billing[first_name]", firstName);
    form.set("billing[last_name]", lastName);
    form.set("billing[email]", email);
    form.set("billing[phone]", phone || "");

    res = await fetchWithTimeout(wcUrl("/customers"), {
      method: "POST",
      headers: wcHeaders("form"),
      body: form,
    });
  } catch (err) {
    return NextResponse.json(
      {
        message:
          err instanceof Error && err.name === "AbortError"
            ? "Registration timed out while contacting WordPress. Please try again."
            : "Registration could not reach WordPress. Please try again.",
      },
      { status: 503 }
    );
  }

  const data = await safeJson(res);

  if (!res.ok) {
    const message = typeof data.message === "string" ? data.message : "Registration failed";
    if (message.toLowerCase().includes("spamming") || message.toLowerCase().includes("javascript is disabled")) {
      try {
        const user = await registerViaGraphql({ username, email, password, firstName, lastName });
        return NextResponse.json({ id: user.databaseId, email: user.email }, { status: 201 });
      } catch {
        return NextResponse.json(
          { message: "Registration is still being blocked by the WordPress honeypot plugin." },
          { status: 403 }
        );
      }
    }
    if (message.toLowerCase().includes("already registered")) {
      return NextResponse.json({ message: "An account with this email already exists. Please log in." }, { status: 409 });
    }
    return NextResponse.json({ message }, { status: res.status });
  }

  if (typeof data.id !== "number" || typeof data.email !== "string") {
    return NextResponse.json(
      { message: "Registration returned an unexpected response from WordPress." },
      { status: 502 }
    );
  }

  return NextResponse.json({ id: data.id, email: data.email }, { status: 201 });
}
