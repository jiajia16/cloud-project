"use client";

const CHECKIN_BASE_URL =
  process.env.NEXT_PUBLIC_QR_API ?? "http://localhost:8004";

type FetchOptions = {
  accessToken: string;
  signal?: AbortSignal;
};

type CheckinResponse = {
  id: string;
  trail_id: string;
  org_id: string;
  user_id: string;
  method: string;
  checked_at: string;
  checked_by: string | null;
};

export type Checkin = CheckinResponse;

export type TrailQrToken = {
  token: string;
  expires_at: number;
  url: string;
  activity_id?: string | null;
  activity_order?: number | null;
  points?: number | null;
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

async function handleError(response: Response): Promise<never> {
  try {
    const data = await response.json();
    const message = (data as any)?.detail || (data as any)?.message;
    throw new Error(message || "Unable to complete request.");
  } catch {
    const text = await response.text().catch(() => "");
    if (text) {
      throw new Error(text);
    }
    throw new Error("Unable to complete request.");
  }
}

export async function createTrailQr({
  accessToken,
  trailId,
  signal,
}: FetchOptions & { trailId: string }) {
  const response = await fetch(
    CHECKIN_BASE_URL + "/checkin/trails/" + trailId + "/qr",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + accessToken,
      },
      credentials: "include",
      signal,
    }
  );

  return handleResponse<TrailQrToken>(response);
}

export async function createActivityQr({
  accessToken,
  trailId,
  activityId,
  activityOrder,
  points,
  signal,
}: FetchOptions & {
  trailId: string;
  activityId: string;
  activityOrder?: number | null;
  points?: number | null;
}) {
  const response = await fetch(
    CHECKIN_BASE_URL +
      "/checkin/trails/" +
      trailId +
      "/activities/" +
      activityId +
      "/qr",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        activity_order: activityOrder ?? undefined,
        points: points ?? undefined,
      }),
      credentials: "include",
      signal,
    }
  );

  return handleResponse<TrailQrToken>(response);
}

export async function getTrailRoster({
  accessToken,
  trailId,
  signal,
}: FetchOptions & { trailId: string }) {
  const response = await fetch(
    CHECKIN_BASE_URL + "/checkin/trails/" + trailId + "/roster",
    {
      method: "GET",
      headers: {
        Authorization: "Bearer " + accessToken,
      },
      credentials: "include",
      signal,
    }
  );

  return handleResponse<CheckinResponse[]>(response);
}

export async function getTrailQrImage({
  accessToken,
  trailId,
  signal,
}: FetchOptions & { trailId: string }) {
  const response = await fetch(
    CHECKIN_BASE_URL + "/checkin/trails/" + trailId + "/qr.png",
    {
      method: "GET",
      headers: {
        Authorization: "Bearer " + accessToken,
      },
      credentials: "include",
      signal,
    }
  );

  if (!response.ok) {
    return handleError(response);
  }

  return response.blob();
}
