"use client";

const LEADERBOARD_BASE_URL =
    process.env.NEXT_PUBLIC_LEADERBOARD_API ?? "http://localhost:8005";

type FetchOptions = {
    accessToken: string;
    signal?: AbortSignal;
};

type QueryValue = string | number | boolean | null | undefined;

export type LeaderboardRow = {
    user_id: string;
    rank: number;
    score: number;
};

export type AttendanceEntry = {
    id: string;
    trail_id: string;
    org_id: string;
    user_id: string;
    checked_at: string;
};

function buildQuery(params: Record<string, QueryValue>) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
            return;
        }
        search.append(key, String(value));
    });
    const qs = search.toString();
    return qs ? `?${qs}` : "";
}

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

function authHeaders(accessToken: string): HeadersInit {
    return {
        Authorization: "Bearer " + accessToken,
    } satisfies HeadersInit;
}

export async function getSystemLeaderboard({
    accessToken,
    limit,
    ym,
    signal,
}: FetchOptions & { limit?: number; ym?: number }) {
    const qs = buildQuery({ limit, ym });
    const response = await fetch(
        LEADERBOARD_BASE_URL + "/leaderboard/system" + qs,
        {
            method: "GET",
            headers: authHeaders(accessToken),
            credentials: "include",
            signal,
        }
    );

    return handleResponse<LeaderboardRow[]>(response);
}

export async function getOrgLeaderboard({
    accessToken,
    orgId,
    limit,
    ym,
    signal,
}: FetchOptions & { orgId: string; limit?: number; ym?: number }) {
    const qs = buildQuery({ limit, ym });
    const response = await fetch(
        LEADERBOARD_BASE_URL + "/leaderboard/orgs/" + orgId + qs,
        {
            method: "GET",
            headers: authHeaders(accessToken),
            credentials: "include",
            signal,
        }
    );

    return handleResponse<LeaderboardRow[]>(response);
}

export async function getTrailAttendance({
    accessToken,
    trailId,
    orgId,
    signal,
}: FetchOptions & { trailId: string; orgId: string }) {
    const qs = buildQuery({ org_id: orgId });
    const response = await fetch(
        LEADERBOARD_BASE_URL + "/attendance/trails/" + trailId + qs,
        {
            method: "GET",
            headers: authHeaders(accessToken),
            credentials: "include",
            signal,
        }
    );

    return handleResponse<AttendanceEntry[]>(response);
}

export async function getMyAttendance({
    accessToken,
    signal,
}: FetchOptions) {
    const response = await fetch(
        LEADERBOARD_BASE_URL + "/attendance/users/me",
        {
            method: "GET",
            headers: authHeaders(accessToken),
            credentials: "include",
            signal,
        }
    );

    return handleResponse<AttendanceEntry[]>(response);
}
