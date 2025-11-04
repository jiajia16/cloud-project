const LEADERBOARD_BASE_URL = import.meta.env.VITE_LEADERBOARD_API ?? "http://localhost:8005";

function buildHeaders(accessToken) {
    const headers = {
        "Content-Type": "application/json",
    };
    if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
    }
    return headers;
}

function buildQuery(params = {}) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
            return;
        }
        search.append(key, value);
    });
    const qs = search.toString();
    return qs ? `?${qs}` : "";
}

async function request(path, { method = "GET", accessToken, query, body, signal } = {}) {
    const qs = buildQuery(query);
    const response = await fetch(`${LEADERBOARD_BASE_URL}${path}${qs}`, {
        method,
        headers: buildHeaders(accessToken),
        body: body ? JSON.stringify(body) : undefined,
        credentials: "include",
        signal,
    });

    let payload;
    try {
        payload = await response.json();
    } catch (err) {
        payload = null;
    }

    if (!response.ok) {
        const message = payload?.detail || payload?.message || "Unexpected error";
        throw new Error(typeof message === "string" ? message : JSON.stringify(message));
    }

    return payload;
}

export async function getSystemLeaderboard({ accessToken, limit = 50, ym, signal } = {}) {
    if (!accessToken) {
        throw new Error("You must be signed in to view the leaderboard.");
    }
    return request("/leaderboard/system", {
        accessToken,
        signal,
        query: { limit, ym },
    });
}

export async function getOrgLeaderboard({ accessToken, orgId, limit = 50, ym, signal } = {}) {
    if (!accessToken) {
        throw new Error("You must be signed in to view the leaderboard.");
    }
    if (!orgId) {
        throw new Error("Organisation is required to view this leaderboard.");
    }
    return request(`/leaderboard/orgs/${orgId}`, {
        accessToken,
        signal,
        query: { limit, ym },
    });
}

export async function getMyAttendance({ accessToken, signal } = {}) {
    if (!accessToken) {
        throw new Error("You must be signed in to view attendance history.");
    }
    return request("/attendance/users/me", {
        accessToken,
        signal,
    });
}

