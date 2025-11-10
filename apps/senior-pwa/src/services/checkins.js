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

export function extractTokenFromScan(rawValue, options = {}) {
    const { withMetadata = false } = options;
    if (!rawValue || typeof rawValue !== "string") {
        return withMetadata ? null : "";
    }
    const trimmed = rawValue.trim();
    if (!trimmed) {
        return withMetadata ? null : "";
    }

    const extractInviteFromPath = (path) => {
        if (!path || typeof path !== "string") {
            return null;
        }
        const match = path.match(/\/invites\/([^\/?#]+)/i);
        if (match?.[1]) {
            try {
                return decodeURIComponent(match[1]);
            } catch {
                return match[1];
            }
        }
        return null;
    };

    const parseActivityMetadata = (searchParams) => {
        if (!searchParams) {
            return null;
        }
        const toNumber = (value) => {
            if (value === null || value === undefined || value === "") {
                return undefined;
            }
            const num = Number(value);
            return Number.isFinite(num) ? num : undefined;
        };

        const meta = {
            activityId:
                searchParams.get("t") ??
                searchParams.get("activity_id") ??
                searchParams.get("activity"),
            activityOrder:
                toNumber(
                    searchParams.get("a") ??
                        searchParams.get("activity_order") ??
                        searchParams.get("order")
                ),
            points: toNumber(searchParams.get("p") ?? searchParams.get("points")),
        };

        const hasValue =
            (meta.activityId && meta.activityId !== "") ||
            meta.activityOrder !== undefined ||
            meta.points !== undefined;
        return hasValue ? meta : null;
    };

    const formatResult = (token, metadata = null) => {
        if (withMetadata) {
            return {
                token,
                metadata,
                source: trimmed,
            };
        }
        return token;
    };

    const tryExtractFromUrl = (value, base) => {
        try {
            const url = base ? new URL(value, base) : new URL(value);
            const tokenParam = url.searchParams.get("token");
            const meta = parseActivityMetadata(url.searchParams);
            if (tokenParam) {
                return formatResult(tokenParam, meta);
            }
            const inviteSegment = extractInviteFromPath(url.pathname);
            if (inviteSegment) {
                return formatResult(inviteSegment, meta);
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

    if (trimmed.includes("token=")) {
        try {
            const search = trimmed.includes("?") ? trimmed.split("?").pop() ?? "" : trimmed;
            const params = new URLSearchParams(search);
            const tokenParam = params.get("token");
            if (tokenParam) {
                return formatResult(tokenParam, parseActivityMetadata(params));
            }
        } catch {
            // ignore parsing issues and continue with regex fallback
        }
    }

    const queryMatch = trimmed.match(/token=([^&]+)/i);
    if (queryMatch) {
        const rawToken = (() => {
            try {
                return decodeURIComponent(queryMatch[1]);
            } catch {
                return queryMatch[1];
            }
        })();
        return formatResult(rawToken);
    }

    const inviteSegment = extractInviteFromPath(trimmed);
    if (inviteSegment) {
        return formatResult(inviteSegment);
    }

    return formatResult(trimmed);
}

export function normalizeToken(rawToken) {
    if (!rawToken || typeof rawToken !== "string") {
        return "";
    }
    let value = rawToken.trim();
    if (!value) {
        return "";
    }

    // If the value looks like a URL or query fragment, extract the token param.
    if (value.includes("token=") || value.includes("/")) {
        try {
            const url = new URL(value, value.startsWith("http") ? undefined : "http://placeholder.local");
            const paramToken = url.searchParams.get("token");
            if (paramToken) {
                value = paramToken;
            }
        } catch {
            // ignore URL parsing issues and keep original value
        }
    }

    const ampIndex = value.indexOf("&");
    if (ampIndex >= 0) {
        value = value.slice(0, ampIndex);
    }
    if (value.startsWith("token=")) {
        value = value.slice(6);
    }
    return value.trim();
}

export async function scanCheckin({
    accessToken,
    token,
    activityId,
    activityOrder,
    points,
    signal,
} = {}) {
    if (!token) {
        throw new Error("QR token is required to check in.");
    }
    if (!accessToken) {
        throw new Error("You must be signed in to scan a QR code.");
    }

    const cleanedToken = normalizeToken(token);
    if (!cleanedToken) {
        throw new Error("QR token is required to check in.");
    }

    const body = { token: cleanedToken };
    if (activityId) {
        body.activity_id = activityId;
    }
    if (activityOrder !== undefined && activityOrder !== null) {
        body.activity_order = activityOrder;
    }
    if (points !== undefined && points !== null) {
        body.points = points;
    }

    if (import.meta.env?.DEV) {
        console.debug("[checkins] POST /checkin/scan", body);
    }

    return request("/checkin/scan", {
        method: "POST",
        accessToken,
        signal,
        body,
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
