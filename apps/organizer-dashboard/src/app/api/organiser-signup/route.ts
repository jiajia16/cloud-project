import { NextResponse } from "next/server";

const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_API ?? "http://localhost:8001";

function normalise(input: unknown): string {
  if (typeof input !== "string") {
    return "";
  }
  return input.trim();
}

type SignupRequestBody = {
  name: string;
  nric: string;
  username: string;
  password: string;
};

export async function POST(request: Request) {
  const clientId = process.env.AUTH_SERVICE_CLIENT_ID;
  const clientSecret = process.env.AUTH_SERVICE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      {
        message:
          "Organiser signup is not configured. Ask an administrator to set AUTH_SERVICE_CLIENT_ID and AUTH_SERVICE_CLIENT_SECRET.",
      },
      { status: 503 }
    );
  }

  let payload: SignupRequestBody | null = null;
  try {
    const body = (await request.json()) as Partial<SignupRequestBody> | null;
    if (body) {
      payload = {
        name: normalise(body.name),
        nric: normalise(body.nric),
        username: normalise(body.username),
        password: typeof body.password === "string" ? body.password : "",
      };
    }
  } catch (error) {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  if (!payload || !payload.name || !payload.nric || !payload.username || !payload.password) {
    return NextResponse.json(
      { message: "All fields (name, NRIC, username, password) are required." },
      { status: 400 }
    );
  }

  const response = await fetch(`${AUTH_BASE_URL}/auth/organisers/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      name: payload.name,
      nric: payload.nric,
      username: payload.username,
      password: payload.password,
    }),
    cache: "no-store",
  });

  let responseBody: any = null;
  try {
    responseBody = await response.json();
  } catch (error) {
    responseBody = null;
  }

  if (!response.ok) {
    const message =
      responseBody?.detail || responseBody?.message || "Unable to create organiser account.";
    return NextResponse.json({ message }, { status: response.status });
  }

  return NextResponse.json({ message: "Organiser account created successfully." }, { status: 201 });
}
