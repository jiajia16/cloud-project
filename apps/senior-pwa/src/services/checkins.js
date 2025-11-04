const CHECKIN_BASE_URL = import.meta.env.VITE_QR_API ?? "http://localhost:8004";

function buildHeaders(accessToken) {
    const headers = {
        "Content-Type": "application/json",
    };
    if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
    }
    return headers;
}

async function request(path, { method = "GET", accessToken, body, signal } = {}) {
    const response = await fetch(`${CHECKIN_BASE_URL}${path}`, {
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

export function extractTokenFromScan(rawValue) {
    if (!rawValue || typeof rawValue !== "string") {
        return "";
    }
    const trimmed = rawValue.trim();
    if (!trimmed) {
        return "";
    }

    const tryExtractFromUrl = (value, base) => {
        try {
            const url = base ? new URL(value, base) : new URL(value);
            const tokenParam = url.searchParams.get("token");
            if (tokenParam) {
                return tokenParam;
            }
        } catch {
            return null;
        }
        return null;
    };

    const fromAbsolute = tryExtractFromUrl(trimmed);
    if (fromAbsolute) {
        return fromAbsolute;
    }

    const fromRelative = tryExtractFromUrl(trimmed, "http://placeholder.local");
    if (fromRelative) {
        return fromRelative;
    }

    const queryMatch = trimmed.match(/token=([^&]+)/i);
    if (queryMatch) {
        try {
            return decodeURIComponent(queryMatch[1]);
        } catch {
            return queryMatch[1];
        }
    }

    return trimmed;
}

export async function scanCheckin({ accessToken, token, signal } = {}) {
    if (!token) {
        throw new Error("QR token is required to check in.");
    }
    if (!accessToken) {
        throw new Error("You must be signed in to scan a QR code.");
    }

    return request("/checkin/scan", {
        method: "POST",
        accessToken,
        signal,
        body: { token },
    });
}

export async function listMyCheckins({ accessToken, signal } = {}) {
    if (!accessToken) {
        throw new Error("You must be signed in to view your check-ins.");
    }
    return request("/checkin/users/me", {
        method: "GET",
        accessToken,
        signal,
    });
}

