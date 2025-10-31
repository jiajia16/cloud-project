// src/contexts/AuthContext.jsx
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    logoutUser,
    refreshTokens as refreshTokensApi,
    fetchCurrentUser,
} from "../services/auth.js";

const STORAGE_KEY = "silvertrails-auth";
const DEFAULT_EXPIRY_SECONDS = 15 * 60;
const REFRESH_BUFFER_MS = 60_000;
const MIN_REFRESH_DELAY_MS = 5_000;

const initialState = { user: null, tokens: null, expiresAt: null };

const AuthContext = createContext({
    user: null,
    tokens: null,
    expiresAt: null,
    isAuthenticated: false,
    login: () => {},
    logout: () => {},
    refreshSession: () => Promise.resolve(),
});

function computeExpiry(expiresInSeconds) {
    const seconds = Number.isFinite(expiresInSeconds) ? expiresInSeconds : DEFAULT_EXPIRY_SECONDS;
    return Date.now() + Math.max(seconds, 0) * 1000;
}

function loadStoredAuth() {
    if (typeof window === "undefined") {
        return initialState;
    }
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return initialState;
        }
        const parsed = JSON.parse(raw);
        const expiresAtRaw = parsed?.expiresAt;
        const expiresAt =
            typeof expiresAtRaw === "string" ? Number(expiresAtRaw) : Number(expiresAtRaw);
        if (
            parsed?.tokens?.access_token &&
            Number.isFinite(expiresAt) &&
            expiresAt > Date.now()
        ) {
            return {
                user: parsed.user ?? null,
                tokens: parsed.tokens,
                expiresAt,
            };
        }
    } catch (err) {
        console.warn("Failed to parse stored auth state", err);
    }
    return initialState;
}

export function AuthProvider({ children }) {
    const [state, setState] = useState(() => loadStoredAuth());
    const [loggingOut, setLoggingOut] = useState(false);
    const refreshTimerRef = useRef(null);
    const isRefreshingRef = useRef(false);

    const clearRefreshTimer = useCallback(() => {
        if (refreshTimerRef.current) {
            window.clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }
        if (state.user && state.tokens?.access_token && state.expiresAt) {
            const payload = {
                user: state.user,
                tokens: state.tokens,
                expiresAt: state.expiresAt,
            };
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        } else {
            window.localStorage.removeItem(STORAGE_KEY);
        }
    }, [state]);

    const login = useCallback((authPayload) => {
        if (!authPayload?.user || !authPayload?.tokens) {
            throw new Error("Invalid auth payload");
        }
        const expiresAt = computeExpiry(authPayload.tokens.expires_in);
        setState({
            user: authPayload.user,
            tokens: authPayload.tokens,
            expiresAt,
        });
    }, []);

    const logout = useCallback(async () => {
        if (!state.tokens || loggingOut) {
            clearRefreshTimer();
            setState(initialState);
            if (typeof window !== "undefined") {
                window.localStorage.removeItem(STORAGE_KEY);
            }
            return;
        }
        setLoggingOut(true);
        try {
            await logoutUser({
                refreshToken: state.tokens.refresh_token,
                accessToken: state.tokens.access_token,
            });
        } catch (err) {
            console.warn("Logout request failed", err);
        } finally {
            clearRefreshTimer();
            setState(initialState);
            setLoggingOut(false);
            if (typeof window !== "undefined") {
                window.localStorage.removeItem(STORAGE_KEY);
            }
        }
    }, [state.tokens, loggingOut, clearRefreshTimer]);

    const refreshSession = useCallback(async () => {
        if (!state.tokens?.refresh_token || !state.tokens?.access_token) {
            return;
        }
        if (isRefreshingRef.current) {
            return;
        }
        isRefreshingRef.current = true;
        try {
            const nextTokens = await refreshTokensApi({
                refreshToken: state.tokens.refresh_token,
                accessToken: state.tokens.access_token,
            });
            let profile = null;
            try {
                profile = await fetchCurrentUser({ accessToken: nextTokens.access_token });
            } catch (profileErr) {
                console.warn("Failed to fetch current user after refresh", profileErr);
            }
            setState((prev) => ({
                user: profile ?? prev.user,
                tokens: { ...(prev.tokens ?? {}), ...nextTokens },
                expiresAt: computeExpiry(nextTokens.expires_in),
            }));
        } catch (err) {
            console.warn("Session refresh failed", err);
            clearRefreshTimer();
            setState(initialState);
            if (typeof window !== "undefined") {
                window.localStorage.removeItem(STORAGE_KEY);
            }
        } finally {
            isRefreshingRef.current = false;
        }
    }, [state.tokens, clearRefreshTimer]);

    const scheduleRefresh = useCallback(
        (expiresAt) => {
            if (!expiresAt || !state.tokens?.refresh_token) {
                clearRefreshTimer();
                return;
            }
            const now = Date.now();
            const msUntilExpiry = expiresAt - now;
            const refreshDelay =
                msUntilExpiry <= REFRESH_BUFFER_MS
                    ? MIN_REFRESH_DELAY_MS
                    : Math.max(msUntilExpiry - REFRESH_BUFFER_MS, MIN_REFRESH_DELAY_MS);

            clearRefreshTimer();
            refreshTimerRef.current = window.setTimeout(() => {
                refreshSession();
            }, refreshDelay);
        },
        [state.tokens, clearRefreshTimer, refreshSession]
    );

    useEffect(() => {
        if (!state.tokens?.access_token || !state.expiresAt) {
            clearRefreshTimer();
            return;
        }
        scheduleRefresh(state.expiresAt);
        return () => {
            clearRefreshTimer();
        };
    }, [state.tokens?.access_token, state.expiresAt, scheduleRefresh, clearRefreshTimer]);

    useEffect(() => {
        if (!state.tokens?.access_token) {
            return;
        }
        let cancelled = false;
        if (state.user) {
            return;
        }
        (async () => {
            try {
                const profile = await fetchCurrentUser({ accessToken: state.tokens.access_token });
                if (!cancelled) {
                    setState((prev) => ({
                        ...prev,
                        user: profile,
                    }));
                }
            } catch (err) {
                console.warn("Failed to fetch current user profile", err);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [state.tokens?.access_token, state.user]);

    const contextValue = useMemo(
        () => ({
            user: state.user,
            tokens: state.tokens,
            expiresAt: state.expiresAt,
            isAuthenticated: !!state.user && !!state.tokens?.access_token,
            login,
            logout,
            refreshSession,
        }),
        [state.user, state.tokens, state.expiresAt, login, logout, refreshSession]
    );

    return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}
