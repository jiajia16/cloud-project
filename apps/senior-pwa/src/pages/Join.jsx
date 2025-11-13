import React, { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle,
    Loader2,
    LogIn,
    QrCode,
    UserPlus,
} from "lucide-react";
import { Button } from "@silvertrails/ui";

import QRScanner from "../components/QRScanner.jsx";
import { extractTokenFromScan } from "../services/checkins.js";
import { previewInvite, acceptInvite } from "../services/trails.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useLocale } from "../contexts/LocaleContext.jsx";
import { setPendingInviteToken } from "../utils/pendingInvite.js";
import { t, formatDateTime } from "../i18n/index.js";

export default function Join() {
    const navigate = useNavigate();
    const { isAuthenticated, tokens } = useAuth();
    useLocale();
    const accessToken = tokens?.access_token;

    const [manualToken, setManualToken] = useState("");
    const [activeToken, setActiveToken] = useState("");
    const [preview, setPreview] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [joinLoading, setJoinLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const inflightTokenRef = useRef("");

    const trailDetails = useMemo(() => {
        if (!preview) {
            return null;
        }
        if (preview.trail) {
            return preview.trail;
        }
        return preview;
    }, [preview]);

    const requestPreview = useCallback(
        async (candidateToken) => {
            const trimmed = candidateToken?.trim();
            if (!trimmed) {
                setError(t("join.errors.unreadable"));
                return;
            }
            setPreview(null);
            setSuccess("");
            setError("");
            setManualToken(trimmed);
            setActiveToken(trimmed);
            setPreviewLoading(true);
            try {
                const data = await previewInvite({ accessToken, token: trimmed });
                setPreview(data);
            } catch (err) {
                setError(
                    err?.message ??
                        t("join.errors.invalid")
                );
            } finally {
                setPreviewLoading(false);
            }
        },
        [accessToken]
    );

    const handleScan = useCallback(
        (rawValue) => {
            if (!rawValue) {
                return;
            }
            const token = extractTokenFromScan(rawValue);
            if (!token || inflightTokenRef.current === token) {
                return;
            }
            inflightTokenRef.current = token;
            Promise.resolve(requestPreview(token)).finally(() => {
                inflightTokenRef.current = "";
            });
        },
        [requestPreview]
    );

    const handleManualPreview = useCallback(
        (event) => {
            event?.preventDefault();
            requestPreview(manualToken);
        },
        [manualToken, requestPreview]
    );

    const handleJoin = useCallback(async () => {
        if (!isAuthenticated) {
            setError(t("join.errors.authRequired"));
            return;
        }
        if (!activeToken || !trailDetails) {
            setError(t("join.errors.previewRequired"));
            return;
        }
        setJoinLoading(true);
        setError("");
        setSuccess("");
        try {
            await acceptInvite({ accessToken, token: activeToken });
            setSuccess(t("join.success.joined"));
        } catch (err) {
            setError(err?.message ?? t("join.errors.joinFailure"));
        } finally {
            setJoinLoading(false);
        }
    }, [accessToken, activeToken, isAuthenticated, trailDetails]);

    const handleAuthRedirect = useCallback(
        (path) => {
            if (!activeToken) {
                setError(t("join.errors.inviteMissing"));
                return;
            }
            setPendingInviteToken(activeToken);
            navigate(path, {
                state: activeToken ? { pendingInvite: activeToken } : null,
            });
        },
        [activeToken, navigate]
    );

    const handleBackClick = useCallback(() => {
        if (isAuthenticated) {
            navigate("/home");
            return;
        }
        if (activeToken) {
            setPendingInviteToken(activeToken);
        }
        navigate("/login", {
            state: activeToken ? { pendingInvite: activeToken } : null,
        });
    }, [activeToken, isAuthenticated, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-cyan-100 via-teal-100 to-white">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <button
                    type="button"
                    onClick={handleBackClick}
                    className="flex items-center text-sm text-teal-700 hover:text-teal-800 mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t(isAuthenticated ? "join.back.dashboard" : "join.back.login")}
                </button>

                <div className="bg-white/95 backdrop-blur shadow-xl rounded-3xl px-6 py-8 space-y-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3 text-teal-700">
                            <QrCode className="w-7 h-7" />
                            <div>
                                <h1 className="text-2xl font-semibold text-gray-800">{t("join.heading.title")}</h1>
                                <p className="text-sm text-gray-600">
                                    {t("join.heading.subtitle")}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="space-y-4">
                            <div className="rounded-2xl border border-teal-100 bg-black/90 overflow-hidden">
                                <QRScanner onResult={handleScan} />
                            </div>
                            <p className="text-xs text-gray-500">
                                {t("join.cameraNotice")}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <form onSubmit={handleManualPreview} className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    {t("join.manual.label")}
                                    <input
                                        type="text"
                                        value={manualToken}
                                        onChange={(e) => setManualToken(e.target.value)}
                                        placeholder={t("join.manual.placeholder")}
                                        className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-3 text-sm focus:ring-2 focus:ring-teal-400 outline-none"
                                    />
                                </label>
                                <Button
                                    type="submit"
                                    disabled={previewLoading}
                                    className="w-full bg-teal-500 hover:bg-teal-600 text-white text-base py-3"
                                >
                                    {previewLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {t("join.manual.checking")}
                                        </span>
                                    ) : (
                                        t("join.manual.submit")
                                    )}
                                </Button>
                            </form>

                            {error && (
                                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {success && (
                                <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
                                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p>{success}</p>
                                        <div className="mt-3 flex gap-3">
                                            <Button
                                                type="button"
                                                onClick={() => navigate("/mytrails")}
                                                className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-4 py-2"
                                            >
                                                {t("join.success.viewTrails")}
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={() => navigate("/home")}
                                                className="bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50 text-sm px-4 py-2"
                                            >
                                                {t("join.success.goDashboard")}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {trailDetails ? (
                                <div className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-4">
                                    <h2 className="text-lg font-semibold text-gray-800">{trailDetails.title}</h2>
                                    <p className="mt-1 text-sm text-gray-600">
                                        {trailDetails.description ?? t("home.invite.descriptionFallback")}
                                    </p>
                                    <dl className="mt-4 space-y-2 text-sm text-gray-700">
                                        <div className="flex justify-between">
                                            <dt className="font-medium">{t("join.details.starts")}</dt>
                                            <dd>{formatDateTime(trailDetails.starts_at)}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="font-medium">{t("join.details.ends")}</dt>
                                            <dd>{formatDateTime(trailDetails.ends_at)}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="font-medium">{t("join.details.location")}</dt>
                                            <dd>{trailDetails.location ?? t("common.labels.locationTbc")}</dd>
                                        </div>
                                    </dl>

                                    <div className="mt-5 space-y-3">
                                        {isAuthenticated ? (
                                            <Button
                                                type="button"
                                                onClick={handleJoin}
                                                disabled={joinLoading}
                                                className="w-full bg-teal-500 hover:bg-teal-600 text-white text-base py-3"
                                            >
                                                {joinLoading ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        {t("join.actions.joining")}
                                                    </span>
                                                ) : (
                                                    t("join.actions.join")
                                                )}
                                            </Button>
                                        ) : (
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <Button
                                                    type="button"
                                                    onClick={() => handleAuthRedirect("/signup")}
                                                    className="flex-1 bg-teal-500 hover:bg-teal-600 text-white text-base py-3"
                                                >
                                                    <span className="flex items-center justify-center gap-2">
                                                        <UserPlus className="w-4 h-4" />
                                                        {t("join.actions.signup")}
                                                    </span>
                                                </Button>
                                                <Button
                                                    type="button"
                                                    onClick={() => handleAuthRedirect("/login")}
                                                    className="flex-1 bg-white border border-teal-200 text-teal-700 hover:bg-teal-50 text-base py-3"
                                                >
                                                    <span className="flex items-center justify-center gap-2">
                                                        <LogIn className="w-4 h-4" />
                                                        {t("join.actions.login")}
                                                    </span>
                                                </Button>
                                            </div>
                                        )}
                                        {!isAuthenticated && (
                                            <p className="text-xs text-gray-500 text-center">
                                                {t("join.remember")}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

