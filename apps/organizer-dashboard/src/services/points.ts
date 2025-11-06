"use client";

const POINTS_BASE_URL =
    process.env.NEXT_PUBLIC_POINTS_API ?? "http://localhost:8003";
const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_API ?? "http://localhost:8001";

type FetchOptions = {
    accessToken: string;
    signal?: AbortSignal;
};

type QueryValue = string | number | boolean | null | undefined;

type AdjustPointsResponse = {
    user_id: string;
    org_id: string;
    balance: number;
};

type UserLookupResponse = {
    id: string;
    name: string;
    nric: string;
    role: "attend_user" | "organiser" | "admin";
    org_ids: string[];
};

export type PointsBalance = {
    user_id: string;
    org_id: string;
    balance: number;
    updated_at: string | null;
};

export type PointsLedgerEntry = {
    id: string;
    user_id?: string;
    org_id?: string;
    delta: number;
    reason: string;
    trail_id: string | null;
    details: string | null;
    occurred_at: string;
};

export type OrgBalance = PointsBalance;

export type OrgBalancePage = {
    items: OrgBalance[];
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
};

export type OrgLedgerEntry = PointsLedgerEntry & {
    user_id: string;
    org_id: string;
};

export type OrgLedgerPage = {
    items: OrgLedgerEntry[];
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
};

export type VoucherStatus = "active" | "disabled";

export type Voucher = {
    id: string;
    org_id: string;
    code: string;
    name: string;
    points_cost: number;
    status: VoucherStatus;
    total_quantity: number | null;
    redeemed_count: number;
};

export type VoucherCreatePayload = {
    code: string;
    name: string;
    points_cost: number;
    total_quantity?: number | null;
};

export type VoucherUpdatePayload = {
    name?: string;
    points_cost?: number;
    status?: VoucherStatus;
    total_quantity?: number | null;
};

export type AdjustPointsPayload = {
    identifier: string;
    delta: number;
    reason?: string;
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

function isUuidLike(value: string) {
    const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidPattern.test(value.trim());
}

async function resolveMemberUserId(
    identifier: string,
    accessToken: string,
    signal?: AbortSignal
) {
    const trimmed = identifier.trim();
    if (isUuidLike(trimmed)) {
        return trimmed;
    }

    const qs = buildQuery({ nric: trimmed });
    const response = await fetch(AUTH_BASE_URL + "/users/lookup" + qs, {
        method: "GET",
        headers: authHeaders(accessToken),
        credentials: "include",
        signal,
    });

    const user = await handleResponse<UserLookupResponse>(response);
    return user.id;
}

export async function getMyPointsBalance({
    accessToken,
    orgId,
    signal,
}: FetchOptions & { orgId: string }) {
    const qs = buildQuery({ org_id: orgId });
    const response = await fetch(
        POINTS_BASE_URL + "/points/users/me/balance" + qs,
        {
            method: "GET",
            headers: authHeaders(accessToken),
            credentials: "include",
            signal,
        }
    );

    return handleResponse<PointsBalance>(response);
}

export async function getMyPointsLedger({
    accessToken,
    orgId,
    signal,
}: FetchOptions & { orgId: string }) {
    const qs = buildQuery({ org_id: orgId });
    const response = await fetch(
        POINTS_BASE_URL + "/points/users/me/ledger" + qs,
        {
            method: "GET",
            headers: authHeaders(accessToken),
            credentials: "include",
            signal,
        }
    );

    return handleResponse<PointsLedgerEntry[]>(response);
}

export async function adjustPoints({
    accessToken,
    orgId,
    payload,
    signal,
}: FetchOptions & { orgId: string; payload: AdjustPointsPayload }) {
    const userId = await resolveMemberUserId(payload.identifier, accessToken, signal);
    const response = await fetch(
        POINTS_BASE_URL + "/points/orgs/" + orgId + "/adjust",
        {
            method: "POST",
            headers: {
                ...authHeaders(accessToken),
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
                user_id: userId,
                delta: payload.delta,
                reason: payload.reason,
            }),
            signal,
        }
    );

    return handleResponse<AdjustPointsResponse>(response);
}

export async function listOrgBalances({
    accessToken,
    orgId,
    limit,
    offset,
    identifier,
    signal,
}: FetchOptions & {
    orgId: string;
    limit?: number;
    offset?: number;
    identifier?: string;
}) {
    let userId: string | undefined;
    if (identifier && identifier.trim().length > 0) {
        userId = await resolveMemberUserId(identifier, accessToken, signal);
    }

    const qs = buildQuery({
        limit,
        offset,
        user_id: userId,
    });

    const response = await fetch(
        POINTS_BASE_URL + "/points/orgs/" + orgId + "/balances" + qs,
        {
            method: "GET",
            headers: authHeaders(accessToken),
            credentials: "include",
            signal,
        }
    );

    return handleResponse<OrgBalancePage>(response);
}

export async function listOrgLedger({
    accessToken,
    orgId,
    limit,
    offset,
    identifier,
    signal,
}: FetchOptions & {
    orgId: string;
    limit?: number;
    offset?: number;
    identifier?: string;
}) {
    let userId: string | undefined;
    if (identifier && identifier.trim().length > 0) {
        userId = await resolveMemberUserId(identifier, accessToken, signal);
    }

    const qs = buildQuery({
        limit,
        offset,
        user_id: userId,
    });

    const response = await fetch(
        POINTS_BASE_URL + "/points/orgs/" + orgId + "/ledger" + qs,
        {
            method: "GET",
            headers: authHeaders(accessToken),
            credentials: "include",
            signal,
        }
    );

    return handleResponse<OrgLedgerPage>(response);
}

export async function listVouchers({
    accessToken,
    orgId,
    signal,
}: FetchOptions & { orgId: string }) {
    const qs = buildQuery({ org_id: orgId });
    const response = await fetch(POINTS_BASE_URL + "/vouchers" + qs, {
        method: "GET",
        headers: authHeaders(accessToken),
        credentials: "include",
        signal,
    });

    return handleResponse<Voucher[]>(response);
}

export async function createVoucher({
    accessToken,
    orgId,
    payload,
    signal,
}: FetchOptions & { orgId: string; payload: VoucherCreatePayload }) {
    const response = await fetch(
        POINTS_BASE_URL + "/vouchers/orgs/" + orgId,
        {
            method: "POST",
            headers: {
                ...authHeaders(accessToken),
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(payload),
            signal,
        }
    );

    return handleResponse<Voucher>(response);
}


export async function updateVoucher({
    accessToken,
    voucherId,
    payload,
    signal,
}: FetchOptions & { voucherId: string; payload: VoucherUpdatePayload }) {
    const response = await fetch(
        POINTS_BASE_URL + "/vouchers/" + voucherId,
        {
            method: "PATCH",
            headers: {
                ...authHeaders(accessToken),
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(payload),
            signal,
        }
    );

    return handleResponse<Voucher>(response);
}
