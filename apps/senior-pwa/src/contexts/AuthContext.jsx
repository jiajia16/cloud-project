// src/contexts/AuthContext.jsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { logoutUser } from "../services/auth.js";

const STORAGE_KEY = "silvertrails-auth";
const initialState = { user: null, tokens: null };

const AuthContext = createContext({
    user: null,
    tokens: null,
    isAuthenticated: false,
    login: () => {},
    logout: () => {},
});

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
        if (parsed?.user && parsed?.tokens?.access_token) {
            return parsed;
        }
    } catch (err) {
        console.warn("Failed to parse stored auth state", err);
    }
    return initialState;
}

export function AuthProvider({ children }) {
    const [state, setState] = useState(() => loadStoredAuth());
    const [loggingOut, setLoggingOut] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }
        if (state.user && state.tokens) {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } else {
            window.localStorage.removeItem(STORAGE_KEY);
        }
    }, [state]);

    const login = useCallback((authPayload) => {
        if (!authPayload?.user || !authPayload?.tokens) {
            throw new Error("Invalid auth payload");
        }
        setState({
            user: authPayload.user,
            tokens: authPayload.tokens,
        });
    }, []);

    const logout = useCallback(async () => {
        if (!state.tokens || loggingOut) {
            setState(initialState);
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
            setState(initialState);
            setLoggingOut(false);
        }
    }, [state.tokens, loggingOut]);

    const contextValue = useMemo(
        () => ({
            user: state.user,
            tokens: state.tokens,
            isAuthenticated: !!state.user && !!state.tokens?.access_token,
            login,
            logout,
        }),
        [state, login, logout]
    );

    return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}
