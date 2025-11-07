import { previewInvite, acceptInvite } from "../services/trails.js";

const STORAGE_KEY = "silvertrails-pending-invite";
const RESULT_KEY = "silvertrails-pending-invite-result";

export function setPendingInviteToken(token) {
    if (typeof window === "undefined") {
        return;
    }
    if (!token) {
        window.sessionStorage.removeItem(STORAGE_KEY);
        return;
    }
    try {
        window.sessionStorage.setItem(STORAGE_KEY, token);
    } catch (err) {
        console.warn("Unable to persist pending invite token", err);
    }
}

export function getPendingInviteToken() {
    if (typeof window === "undefined") {
        return "";
    }
    try {
        return window.sessionStorage.getItem(STORAGE_KEY) ?? "";
    } catch (err) {
        console.warn("Unable to read pending invite token", err);
        return "";
    }
}

export function clearPendingInviteToken() {
    if (typeof window === "undefined") {
        return;
    }
    try {
        window.sessionStorage.removeItem(STORAGE_KEY);
    } catch (err) {
        console.warn("Unable to clear pending invite token", err);
    }
}

export function consumePendingInviteToken() {
    const token = getPendingInviteToken();
    if (token) {
        clearPendingInviteToken();
    }
    return token;
}

export function setPendingInviteResult(result) {
    if (typeof window === "undefined") {
        return;
    }
    if (!result) {
        window.sessionStorage.removeItem(RESULT_KEY);
        return;
    }
    try {
        window.sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
    } catch (err) {
        console.warn("Unable to persist pending invite result", err);
    }
}

export function consumePendingInviteResult() {
    if (typeof window === "undefined") {
        return null;
    }
    try {
        const raw = window.sessionStorage.getItem(RESULT_KEY);
        if (!raw) {
            return null;
        }
        window.sessionStorage.removeItem(RESULT_KEY);
        return JSON.parse(raw);
    } catch (err) {
        console.warn("Unable to read pending invite result", err);
        window.sessionStorage.removeItem(RESULT_KEY);
        return null;
    }
}

export async function autoJoinPendingInvite({ accessToken, signal } = {}) {
    if (!accessToken) {
        return { status: "idle" };
    }
    const token = getPendingInviteToken();
    if (!token) {
        return { status: "idle" };
    }

    try {
        const preview = await previewInvite({ accessToken, token, signal });
        await acceptInvite({ accessToken, token, signal });
        clearPendingInviteToken();
        setPendingInviteResult({
            status: "success",
            token,
            trailTitle:
                preview?.trail?.title ??
                (typeof preview?.title === "string" ? preview.title : null),
        });
        return { status: "success", token };
    } catch (err) {
        clearPendingInviteToken();
        setPendingInviteResult({
            status: "error",
            token,
            message: err?.message ?? "Unable to join with this invite.",
        });
        throw err;
    }
}
