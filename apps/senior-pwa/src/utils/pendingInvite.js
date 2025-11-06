const STORAGE_KEY = "silvertrails-pending-invite";

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

