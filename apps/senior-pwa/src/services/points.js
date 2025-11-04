const POINTS_BASE_URL = import.meta.env.VITE_POINTS_API ?? "http://localhost:8003";

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
    const response = await fetch(`${POINTS_BASE_URL}${path}${qs}`, {
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

export async function getMyBalance({ accessToken, orgId, signal } = {}) {
    if (!accessToken) {
        throw new Error("You must be signed in to view your balance.");
    }
    if (!orgId) {
        throw new Error("Organisation is required to view balance.");
    }
    return request("/points/users/me/balance", {
        accessToken,
        signal,
        query: { org_id: orgId },
    });
}

export async function getMyLedger({ accessToken, orgId, signal } = {}) {
    if (!accessToken) {
        throw new Error("You must be signed in to view your points history.");
    }
    if (!orgId) {
        throw new Error("Organisation is required to view points history.");
    }
    return request("/points/users/me/ledger", {
        accessToken,
        signal,
        query: { org_id: orgId },
    });
}

export async function listOrgVouchers({ accessToken, orgId, signal } = {}) {
    if (!accessToken) {
        throw new Error("You must be signed in to view vouchers.");
    }
    if (!orgId) {
        throw new Error("Organisation is required to view vouchers.");
    }
    return request("/vouchers", {
        accessToken,
        signal,
        query: { org_id: orgId },
    });
}

export async function redeemVoucher({ accessToken, voucherId, signal } = {}) {
    if (!accessToken) {
        throw new Error("You must be signed in to redeem vouchers.");
    }
    if (!voucherId) {
        throw new Error("Voucher ID is required to redeem.");
    }
    return request(`/vouchers/${voucherId}/redeem`, {
        method: "POST",
        accessToken,
        signal,
    });
}

export async function getMyRedemptions({ accessToken, signal } = {}) {
    if (!accessToken) {
        throw new Error("You must be signed in to view redemption history.");
    }
    return request("/vouchers/users/me/redemptions", {
        accessToken,
        signal,
    });
}

