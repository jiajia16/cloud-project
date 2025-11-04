"use client";

const TRAILS_BASE_URL =
  process.env.NEXT_PUBLIC_TRAILS_API ?? "http://localhost:8002";

export type TrailStatus = "draft" | "published" | "closed" | "cancelled";

export type Trail = {
  id: string;
  org_id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  location: string | null;
  capacity: number;
  status: TrailStatus;
};

export type RegistrationStatus =
  | "pending"
  | "approved"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "waitlisted";

export type Registration = {
  id: string;
  trail_id?: string;
  org_id?: string;
  user_id: string;
  status: RegistrationStatus;
  note: string | null;
};

export type RegistrationPage = {
  items: Registration[];
  total: number;
  limit: number | null;
  offset: number;
  hasMore: boolean;
};

export type InviteToken = {
  invite_token: string;
  expires_at: string;
  url: string;
  trail_id: string;
  org_id: string;
};

export type InvitePreview = {
  trail: Trail;
};

type ListTrailsResponse = Trail[];

type FetchOptions = {
  accessToken: string;
  signal?: AbortSignal;
};

type RegistrationResponse = {
  id?: string;
  registration_id?: string;
  trail_id?: string;
  org_id?: string;
  user_id: string;
  status: RegistrationStatus;
  note?: string | null;
};

type RegistrationPageResponse = {
  items: RegistrationResponse[];
  total: number;
  limit: number | null;
  offset: number;
  has_more: boolean;
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

function buildQuery(
  params: Record<string, string | number | undefined | null>
) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(function ([key, value]) {
    if (value === undefined || value === null || value === "") {
      return;
    }
    search.append(key, String(value));
  });
  const qs = search.toString();
  return qs.length > 0 ? "?" + qs : "";
}

function normaliseRegistration(entry: RegistrationResponse): Registration {
  const id = entry.id ?? entry.registration_id;
  if (!id) {
    throw new Error("Registration payload is missing an identifier.");
  }
  return {
    id,
    trail_id: entry.trail_id,
    org_id: entry.org_id,
    user_id: entry.user_id,
    status: entry.status,
    note: entry.note ?? null,
  };
}

export async function listTrails({
  accessToken,
  orgId,
  status,
  signal,
}: FetchOptions & { orgId?: string; status?: TrailStatus }) {
  const qs = buildQuery({ org_id: orgId, status_filter: status });
  const response = await fetch(TRAILS_BASE_URL + "/trails" + qs, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + accessToken,
    },
    credentials: "include",
    signal,
  });

  return handleResponse<ListTrailsResponse>(response);
}

export async function getTrail({
  accessToken,
  trailId,
  signal,
}: FetchOptions & { trailId: string }) {
  const response = await fetch(TRAILS_BASE_URL + "/trails/" + trailId, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + accessToken,
    },
    credentials: "include",
    signal,
  });

  return handleResponse<Trail>(response);
}

export async function getTrailRegistrations({
  accessToken,
  trailId,
  status,
  limit,
  offset,
  signal,
}: FetchOptions & {
  trailId: string;
  status?: RegistrationStatus;
  limit?: number;
  offset?: number;
}) {
  const qs = buildQuery({
    status_filter: status,
    limit,
    offset,
  });
  const response = await fetch(
    TRAILS_BASE_URL + "/trails/" + trailId + "/attendees" + qs,
    {
      method: "GET",
      headers: {
        Authorization: "Bearer " + accessToken,
      },
      credentials: "include",
      signal,
    }
  );

  const payload = await handleResponse<RegistrationPageResponse>(response);
  return {
    items: payload.items.map(normaliseRegistration),
    total: payload.total,
    limit: payload.limit,
    offset: payload.offset,
    hasMore: payload.has_more,
  };
}

export type CreateTrailPayload = {
  title: string;
  description?: string;
  starts_at: string;
  ends_at: string;
  location?: string;
  capacity: number;
  status?: TrailStatus;
};

export async function createTrail({
  accessToken,
  orgId,
  payload,
}: FetchOptions & { orgId: string; payload: CreateTrailPayload }) {
  const response = await fetch(TRAILS_BASE_URL + "/trails/orgs/" + orgId, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken,
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return handleResponse<Trail>(response);
}

export type UpdateTrailPayload = Partial<
  CreateTrailPayload & { status: TrailStatus }
>;

export async function updateTrail({
  accessToken,
  trailId,
  payload,
}: FetchOptions & { trailId: string; payload: UpdateTrailPayload }) {
  const response = await fetch(TRAILS_BASE_URL + "/trails/" + trailId, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken,
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return handleResponse<Trail>(response);
}

export type OrganiserRegistrationPayload = {
  user_id: string;
  note?: string;
};

export async function createRegistrationForTrail({
  accessToken,
  trailId,
  payload,
}: FetchOptions & { trailId: string; payload: OrganiserRegistrationPayload }) {
  const response = await fetch(
    TRAILS_BASE_URL + "/registrations/trails/" + trailId + "/by-organiser",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken,
      },
      credentials: "include",
      body: JSON.stringify(payload),
    }
  );

  const data = await handleResponse<RegistrationResponse>(response);
  return normaliseRegistration(data);
}

type RegistrationMutationOptions = FetchOptions & { registrationId: string };

async function mutateRegistration(
  action: "approve" | "confirm" | "reject" | "cancel",
  { accessToken, registrationId, signal }: RegistrationMutationOptions
) {
  const response = await fetch(
    TRAILS_BASE_URL + "/registrations/" + registrationId + "/" + action,
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + accessToken,
      },
      credentials: "include",
      signal,
    }
  );

  const data = await handleResponse<RegistrationResponse>(response);
  return normaliseRegistration(data);
}

export function approveRegistration(options: RegistrationMutationOptions) {
  return mutateRegistration("approve", options);
}

export function confirmRegistration(options: RegistrationMutationOptions) {
  return mutateRegistration("confirm", options);
}

export function rejectRegistration(options: RegistrationMutationOptions) {
  return mutateRegistration("reject", options);
}

export function cancelRegistration(options: RegistrationMutationOptions) {
  return mutateRegistration("cancel", options);
}

export async function createTrailInvite({
  accessToken,
  trailId,
}: FetchOptions & { trailId: string }) {
  const response = await fetch(
    TRAILS_BASE_URL + "/invites/trails/" + trailId,
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + accessToken,
      },
      credentials: "include",
    }
  );

  return handleResponse<InviteToken>(response);
}

export async function getRegistrationStatus({
  accessToken,
  trailId,
  userId,
  signal,
}: FetchOptions & { trailId: string; userId: string }) {
  const response = await fetch(
    TRAILS_BASE_URL +
      "/trails/" +
      trailId +
      "/registrations/by-user/" +
      userId,
    {
      method: "GET",
      headers: {
        Authorization: "Bearer " + accessToken,
      },
      credentials: "include",
      signal,
    }
  );

  return handleResponse<{ status: RegistrationStatus }>(response);
}

export async function listOwnRegistrations({
  accessToken,
  signal,
}: FetchOptions) {
  const response = await fetch(
    TRAILS_BASE_URL + "/users/me/registrations",
    {
      method: "GET",
      headers: {
        Authorization: "Bearer " + accessToken,
      },
      credentials: "include",
      signal,
    }
  );

  const payload = await handleResponse<RegistrationResponse[]>(response);
  return payload.map(normaliseRegistration);
}

export async function listOwnConfirmedTrails({
  accessToken,
  signal,
}: FetchOptions) {
  const response = await fetch(
    TRAILS_BASE_URL + "/users/me/confirmed-trails",
    {
      method: "GET",
      headers: {
        Authorization: "Bearer " + accessToken,
      },
      credentials: "include",
      signal,
    }
  );

  return handleResponse<Trail[]>(response);
}

export async function previewInvite({
  accessToken,
  token,
  signal,
}: FetchOptions & { token: string }) {
  const response = await fetch(
    TRAILS_BASE_URL + "/invites/" + token,
    {
      method: "GET",
      headers: {
        Authorization: "Bearer " + accessToken,
      },
      credentials: "include",
      signal,
    }
  );

  return handleResponse<InvitePreview>(response);
}

export async function acceptInvite({
  accessToken,
  token,
  signal,
}: FetchOptions & { token: string }) {
  const response = await fetch(
    TRAILS_BASE_URL + "/invites/" + token + "/register",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + accessToken,
      },
      credentials: "include",
      signal,
    }
  );

  const payload = await handleResponse<RegistrationResponse>(response);
  return normaliseRegistration(payload);
}
