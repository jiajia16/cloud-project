const AUTH_BASE_URL = import.meta.env.VITE_AUTH_API ?? "http://localhost:8001";

async function request(path, { method = "GET", body, token } = {}) {
    const headers = {
        "Content-Type": "application/json",
    };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(`${AUTH_BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        credentials: "include",
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

export async function signupAttendee({ name, nric, passcode }) {
    return request("/auth/signup", {
        method: "POST",
        body: {
            name,
            nric,
            passcode,
            role: "attend_user",
        },
    });
}

export async function loginUser({ nric, passcode }) {
    return request("/auth/login", {
        method: "POST",
        body: { nric, passcode },
    });
}

export async function logoutUser({ refreshToken, accessToken }) {
    return request("/auth/logout", {
        method: "POST",
        body: { refresh_token: refreshToken },
        token: accessToken,
    });
}
