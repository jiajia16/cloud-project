const TRAILS_BASE_URL = import.meta.env.VITE_TRAILS_API ?? "http://localhost:8002";

function buildQuery(query = {}) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
            return;
        }
        if (Array.isArray(value)) {
            value.forEach((val) => params.append(key, val));
        } else {
            params.append(key, value);
        }
    });
    const qs = params.toString();
    return qs ? `?${qs}` : "";
}

async function request(path, { method = "GET", token, query, body, signal } = {}) {
    const headers = {
        "Content-Type": "application/json",
    };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    const qs = buildQuery(query);
    const response = await fetch(`${TRAILS_BASE_URL}${path}${qs}`, {
        method,
        headers,
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

export async function listTrails({ accessToken, orgId, status, dateFrom, dateTo, signal } = {}) {
    return request("/trails", {
        method: "GET",
        token: accessToken,
        signal,
        query: {
            org_id: orgId,
            status_filter: status,
            date_from: dateFrom,
            date_to: dateTo,
        },
    });
}

export async function getMyRegistrations({ accessToken, signal } = {}) {
    return request("/users/me/registrations", {
        method: "GET",
        token: accessToken,
        signal,
    });
}

export async function getMyConfirmedTrails({ accessToken, signal } = {}) {
    return request("/users/me/confirmed-trails", {
        method: "GET",
        token: accessToken,
        signal,
    });
}

export async function registerForTrail({ accessToken, trailId, note, signal } = {}) {
    if (!trailId) {
        throw new Error("trailId is required");
    }
    return request(`/registrations/trails/${trailId}/self`, {
        method: "POST",
        token: accessToken,
        signal,
        body: {
            note: note ?? "",
        },
    });
}

export async function getTrail({ accessToken, trailId, signal } = {}) {
    if (!trailId) {
        throw new Error("trailId is required");
    }
    return request(`/trails/${trailId}`, {
        method: "GET",
        token: accessToken,
        signal,
    });
}

export async function getRegistrationStatus({ accessToken, trailId, userId, signal } = {}) {
    if (!trailId || !userId) {
        throw new Error("trailId and userId are required");
    }
    return request(`/trails/${trailId}/registrations/by-user/${userId}`, {
        method: "GET",
        token: accessToken,
        signal,
    });
}

export async function previewInvite({ accessToken, token, signal } = {}) {
    if (!token) {
        throw new Error("Invite token is required");
    }
    return request(`/invites/${token}`, {
        method: "GET",
        token: accessToken,
        signal,
    });
}

export async function acceptInvite({ accessToken, token, signal } = {}) {
    if (!token) {
        throw new Error("Invite token is required");
    }
    return request(`/invites/${token}/register`, {
        method: "POST",
        token: accessToken,
        signal,
    });
}

export async function cancelRegistration({ accessToken, registrationId, signal } = {}) {
    if (!registrationId) {
        throw new Error("registrationId is required");
    }
    return request(`/registrations/${registrationId}`, {
        method: "DELETE",
        token: accessToken,
        signal,
    });
}

