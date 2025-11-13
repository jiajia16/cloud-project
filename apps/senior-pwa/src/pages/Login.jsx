import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useLocation, useNavigate } from "react-router-dom";
import { loginUser } from "../services/auth.js";
import { setPendingInviteToken, autoJoinPendingInvite } from "../utils/pendingInvite.js";
import { t } from "../i18n/index.js";

export default function Login() {
    const [nric, setNric] = useState("");
    const [passcode, setPasscode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const pendingInvite = location.state?.pendingInvite;
        if (!pendingInvite) {
            return;
        }
        setPendingInviteToken(pendingInvite);
        navigate(location.pathname, { replace: true, state: {} });
    }, [location, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!nric.trim() || !passcode.trim()) {
            setError(t("Please enter your NRIC and 8-digit passcode."));
            return;
        }
        setLoading(true);
        try {
            const response = await loginUser({ nric: nric.trim(), passcode: passcode.trim() });
            login(response);
            try {
                await autoJoinPendingInvite({
                    accessToken: response?.tokens?.access_token,
                });
            } catch (inviteErr) {
                console.warn("Pending invite auto-join failed", inviteErr);
            }
            navigate("/home", { replace: true });
        } catch (err) {
            setError(err.message || t("Unable to log in. Please try again."));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cyan-100 to-teal-100">
            <div className="bg-white shadow-xl rounded-3xl p-8 w-[90%] max-w-sm text-center">
                <h1 className="text-3xl font-bold text-teal-600 mb-6">{t("Welcome to SilverTrails")}</h1>

                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                    <label className="block">
                        <span className="text-sm font-medium text-gray-700">{t("NRIC / Identifier")}</span>
                        <input
                            type="text"
                            value={nric}
                            onChange={(e) => setNric(e.target.value)}
                            placeholder={t("e.g. S1234567A")}
                            className="mt-1 w-full border border-gray-300 rounded-xl p-3 text-center focus:ring-2 focus:ring-teal-400 outline-none"
                            autoFocus
                        />
                    </label>
                    <label className="block">
                        <span className="text-sm font-medium text-gray-700">{t("Passcode (8-digit)")}</span>
                        <input
                            type="password"
                            value={passcode}
                            onChange={(e) => setPasscode(e.target.value)}
                            placeholder={t("DDMMYYYY")}
                            className="mt-1 w-full border border-gray-300 rounded-xl p-3 text-center focus:ring-2 focus:ring-teal-400 outline-none"
                            inputMode="numeric"
                            pattern="\d{8}"
                        />
                    </label>

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-2 text-center">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-teal-400 to-cyan-400 text-white text-lg py-3 rounded-xl shadow-md hover:brightness-110 transition disabled:opacity-60"
                        disabled={loading}
                    >
                        {loading ? t("Signing in...") : t("Login")}
                    </button>
                </form>

                <p className="mt-5 text-gray-600">
                    {t("Not a member?")}{" "}
                    <span
                        className="text-teal-600 font-semibold hover:underline cursor-pointer"
                        onClick={() => navigate("/signup")}
                    >
                        {t("Sign up")}
                    </span>
                </p>
                <p className="mt-3 text-sm text-teal-700">
                    {t("Have a QR invite?")}{" "}
                    <span
                        className="font-semibold hover:underline cursor-pointer"
                        onClick={() => navigate("/join")}
                    >
                        {t("Scan to join")}
                    </span>
                </p>
            </div>
        </div>
    );
}

