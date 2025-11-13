import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useLocale } from "../contexts/LocaleContext.jsx";
import {
    getTrail,
    getMyRegistrations,
    getRegistrationStatus,
    registerForTrail,
    cancelRegistration,
} from "../services/trails.js";
import { Card, Button } from "@silvertrails/ui";
import {
    ArrowLeft,
    CalendarRange,
    MapPin,
    Users,
    AlertCircle,
    CheckCircle,
} from "lucide-react";
import { t, formatDateTime } from "../i18n/index.js";

const INACTIVE_REGISTRATION_STATUSES = new Set(["cancelled", "rejected"]);

function formatStatusText(value) {
    if (!value) {
        return "";
    }
    return String(value)
        .replace(/[_-]+/g, " ")
        .split(" ")
        .map((word) => (word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : ""))
        .join(" ");
}

function formatRegistrationStatus(status) {
    if (!status) {
        return "";
    }
    const key = `myTrails.status.${String(status).toLowerCase()}`;
    const label = t(key);
    return label === key ? formatStatusText(status) : label;
}

function formatRegistrationDescription(status) {
    if (!status) {
        return t("myTrails.detail.registration.descriptions.generic");
    }
    const key = `myTrails.detail.registration.descriptions.${String(status).toLowerCase()}`;
    const label = t(key, { status: formatStatusText(status) });
    return label === key
        ? t("myTrails.detail.registration.descriptions.generic", {
            status: formatStatusText(status),
        })
        : label;
}

function formatTrailStatus(status) {
    if (!status) {
        return t("myTrails.available.status.unknown", { status: "" });
    }
    const key = `myTrails.available.status.${String(status).toLowerCase()}`;
    const label = t(key, { status: formatStatusText(status) });
    return label === key ? formatStatusText(status) : label;
}

function formatDateRangeValue(start, end) {
    const startText = start
        ? formatDateTime(start, { fallbackKey: "common.labels.toBeConfirmed" })
        : null;
    const endText = end
        ? formatDateTime(end, { fallbackKey: "common.labels.toBeConfirmed" })
        : null;
    if (startText && endText) {
        return t("common.labels.dateRange", { start: startText, end: endText });
    }
    if (startText || endText) {
        return startText || endText || "";
    }
    return t("common.labels.toBeConfirmed");
}

export default function TrailDetail() {
    const navigate = useNavigate();
    const location = useLocation();
    const { trailId } = useParams();
    const { tokens, user } = useAuth();
    useLocale();
    const accessToken = tokens?.access_token;

    const [trail, setTrail] = useState(location.state?.trail ?? null);
    const [registration, setRegistration] = useState(location.state?.registration ?? null);
    const [loading, setLoading] = useState(!trail);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const initialLoadRef = useRef(!trail);

    const refresh = useCallback(
        async (signal, { forceSpinner = false } = {}) => {
            if (!accessToken || !trailId) {
                return;
            }
            setError("");
            if (forceSpinner || initialLoadRef.current) {
                setLoading(true);
            }
            try {
                const [trailRes, registrations] = await Promise.all([
                    getTrail({ accessToken, trailId, signal }),
                    getMyRegistrations({ accessToken, signal }),
                ]);

                let matchingRegistration =
                    registrations?.find((reg) => reg.trail_id === trailId) ?? null;

                if (matchingRegistration && user?.id) {
                    try {
                        const statusRes = await getRegistrationStatus({
                            accessToken,
                            trailId,
                            userId: user.id,
                            signal,
                        });
                        if (statusRes?.status) {
                            matchingRegistration = {
                                ...matchingRegistration,
                                status: statusRes.status,
                            };
                        }
                    } catch (statusErr) {
                        console.warn("Unable to load registration status", statusErr);
                    }
                }

                if (matchingRegistration && INACTIVE_REGISTRATION_STATUSES.has(matchingRegistration.status)) {
                    matchingRegistration = null;
                }

                setTrail(trailRes);
                setRegistration(matchingRegistration);
            } catch (err) {
                if (!(signal?.aborted)) {
                    setError(err?.message ?? t("myTrails.detail.errors.load"));
                }
            } finally {
                if (!(signal?.aborted)) {
                    initialLoadRef.current = false;
                    setLoading(false);
                }
            }
        },
        [accessToken, trailId, user?.id]
    );

    useEffect(() => {
        if (!accessToken || !trailId) {
            return;
        }
        const controller = new AbortController();
        refresh(controller.signal);
        return () => controller.abort();
    }, [accessToken, trailId, refresh]);

    const canCancel = useMemo(
        () => registration && !INACTIVE_REGISTRATION_STATUSES.has(registration.status),
        [registration]
    );

    const handleJoin = useCallback(async () => {
        if (!accessToken || !trailId) {
            return;
        }
        setActionLoading(true);
        setError("");
        try {
            await registerForTrail({ accessToken, trailId });
            await refresh();
        } catch (err) {
            setError(err?.message ?? t("myTrails.errors.register"));
        } finally {
            setActionLoading(false);
        }
    }, [accessToken, trailId, refresh]);

    const handleCancel = useCallback(async () => {
        if (!accessToken || !registration?.id) {
            return;
        }
        setActionLoading(true);
        setError("");
        try {
            await cancelRegistration({
                accessToken,
                registrationId: registration.id,
            });
            await refresh();
        } catch (err) {
            setError(err?.message ?? t("myTrails.detail.registration.cancelError"));
        } finally {
            setActionLoading(false);
        }
    }, [accessToken, registration?.id, refresh]);

    return (
        <Layout title={t("myTrails.detail.title")}>
            <div className="space-y-6 max-w-3xl mx-auto">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm text-cyan-700 hover:text-cyan-900"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {t("myTrails.detail.back")}
                </button>

                {error && (
                    <Card className="border border-rose-200 bg-rose-50 text-rose-700">
                        <div className="flex gap-2 items-center">
                            <AlertCircle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                    </Card>
                )}

                {loading && (
                    <Card className="p-6 text-sm text-gray-600">
                        {t("myTrails.detail.loading")}
                    </Card>
                )}

                {!loading && trail && (
                    <Card className="p-6 space-y-4">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold text-gray-900">{trail.title}</h2>
                            <p className="text-sm text-gray-600">{trail.description}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                            <div className="flex items-center gap-2">
                                <CalendarRange className="w-5 h-5 text-teal-600" />
                                <span>{formatDateRangeValue(trail.starts_at, trail.ends_at)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-teal-600" />
                                <span>{trail.location ?? t("common.labels.locationTbc")}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-teal-600" />
                                <span>
                                    {t("myTrails.detail.info.capacity", {
                                        capacity:
                                            trail.capacity ?? t("myTrails.available.capacityUnknown"),
                                    })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-teal-600" />
                                <span>
                                    {t("myTrails.detail.info.status", {
                                        status: formatTrailStatus(trail.status),
                                    })}
                                </span>
                            </div>
                        </div>

                        {registration ? (
                            <div className="space-y-3">
                                <Card className="bg-cyan-50 border border-cyan-100">
                                    <p className="font-semibold text-cyan-800 text-sm">
                                        {t("myTrails.detail.registration.heading")}
                                    </p>
                                    <p className="text-lg font-bold text-cyan-700">
                                        {formatRegistrationStatus(registration.status)}
                                    </p>
                                    <p className="text-sm text-cyan-700/80">
                                        {formatRegistrationDescription(registration.status)}
                                    </p>
                                    {registration.note && (
                                        <p className="mt-2 text-xs text-cyan-800/80">
                                            {t("myTrails.messages.registrationNote", {
                                                note: registration.note,
                                            })}
                                        </p>
                                    )}
                                </Card>
                                <div className="flex flex-wrap gap-3">
                                    {canCancel && (
                                        <Button
                                            onClick={handleCancel}
                                            className="bg-rose-500 hover:bg-rose-600 text-white"
                                            disabled={actionLoading}
                                        >
                                            {actionLoading
                                                ? t("myTrails.detail.registration.cancelling")
                                                : t("myTrails.detail.registration.cancel")}
                                        </Button>
                                    )}
                                    {!canCancel && (
                                        <p className="text-xs text-gray-500">
                                            {t("myTrails.detail.registration.noCancel")}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-sm text-gray-700">
                                    {t("myTrails.detail.callToAction.prompt")}
                                </p>
                                <Button
                                    onClick={handleJoin}
                                    className="bg-teal-500 hover:bg-teal-600 text-white"
                                    disabled={actionLoading}
                                >
                                    {actionLoading
                                        ? t("myTrails.detail.callToAction.joining")
                                        : t("myTrails.detail.callToAction.join")}
                                </Button>
                            </div>
                        )}
                    </Card>
                )}
            </div>
        </Layout>
    );
}
