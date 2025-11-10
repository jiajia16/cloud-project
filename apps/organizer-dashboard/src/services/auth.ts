"use client";

const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_API ?? "http://localhost:8001";

export type OrganiserProfile = {
  id: string;
  name: string;
  nric: string;
  role: "organiser" | "admin";
  org_ids: string[];
};

export type UserSummary = {
  id: string;
  name: string;
  nric: string;
  role: "attend_user" | "organiser" | "admin";
  org_ids: string[];
};

export type TokenPair = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

type OrganiserLoginResponse = {
  user: OrganiserProfile;
  tokens: TokenPair;
};

async function handleResponse<T>(response: Response): Promise<T> {
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      (payload as any)?.detail ||
      (payload as any)?.message ||
      "Unable to complete request.";
    throw new Error(message);
  }

  return payload as T;
}

export async function organiserLogin({
  username,
  password,
}: {
  username: string;
  password: string;
}): Promise<OrganiserLoginResponse> {
  const response = await fetch(`${AUTH_BASE_URL}/auth/organisers/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
    credentials: "include",
  });

  return handleResponse<OrganiserLoginResponse>(response);
}

export async function organiserRefresh({
  accessToken,
  refreshToken,
}: {
  accessToken: string;
  refreshToken: string;
}): Promise<TokenPair> {
  const response = await fetch(`${AUTH_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
    credentials: "include",
  });

  return handleResponse<TokenPair>(response);
}

export async function organiserLogout({
  accessToken,
  refreshToken,
}: {
  accessToken: string;
  refreshToken: string;
}): Promise<void> {
  const response = await fetch(`${AUTH_BASE_URL}/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
    credentials: "include",
  });

  if (!response.ok) {
    await handleResponse<unknown>(response);
  }
}

export async function fetchOrganiserProfile({
  accessToken,
}: {
  accessToken: string;
}): Promise<OrganiserProfile> {
  const response = await fetch(`${AUTH_BASE_URL}/users/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: "include",
  });

  return handleResponse<OrganiserProfile>(response);
}

function looksLikeUuid(value: string) {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(value.trim());
}

export async function lookupParticipantByNric({
  accessToken,
  nric,
  signal,
}: {
  accessToken: string;
  nric: string;
  signal?: AbortSignal;
}): Promise<UserSummary> {
  const search = new URLSearchParams();
  search.append("nric", nric.trim());
  const response = await fetch(
    `${AUTH_BASE_URL}/users/lookup?${search.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
      signal,
    }
  );

  return handleResponse<UserSummary>(response);
}

export async function resolveParticipantUserId({
  accessToken,
  identifier,
  signal,
}: {
  accessToken: string;
  identifier: string;
  signal?: AbortSignal;
}): Promise<{ userId: string; profile: UserSummary | null }> {
  const trimmed = identifier.trim();
  if (!trimmed) {
    throw new Error("Participant identifier is required.");
  }
  if (looksLikeUuid(trimmed)) {
    return { userId: trimmed, profile: null };
  }
  const profile = await lookupParticipantByNric({
    accessToken,
    nric: trimmed,
    signal,
  });
  return { userId: profile.id, profile };
}

export type OrganisationSummary = {
  id: string;
  name: string;
};

export type OrganisationStats = {
  org_id: string;
  organisers: number;
  attendees: number;
  total_members: number;
};

export async function listOrganisations({
  accessToken,
  signal,
}: {
  accessToken: string;
  signal?: AbortSignal;
}): Promise<OrganisationSummary[]> {
  const response = await fetch(`${AUTH_BASE_URL}/orgs`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: "include",
    signal,
  });

  return handleResponse<OrganisationSummary[]>(response);
}

export async function listParticipants({
  accessToken,
  signal,
}: {
  accessToken: string;
  signal?: AbortSignal;
}): Promise<UserSummary[]> {
  const response = await fetch(`${AUTH_BASE_URL}/users/participants`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: "include",
    signal,
  });

  return handleResponse<UserSummary[]>(response);
}

export async function assignParticipantToOrganisation({
  accessToken,
  orgId,
  userId,
}: {
  accessToken: string;
  orgId: string;
  userId: string;
}): Promise<void> {
  const response = await fetch(`${AUTH_BASE_URL}/orgs/${orgId}/members`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ user_id: userId }),
    credentials: "include",
  });

  if (!response.ok) {
    await handleResponse<unknown>(response);
  }
}

export async function getOrganisationStats({
  accessToken,
  orgId,
  signal,
}: {
  accessToken: string;
  orgId: string;
  signal?: AbortSignal;
}): Promise<OrganisationStats> {
  const response = await fetch(`${AUTH_BASE_URL}/orgs/${orgId}/stats`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: "include",
    signal,
  });

  return handleResponse<OrganisationStats>(response);
}
