import React, { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout.jsx";
import { useNavigate } from "react-router-dom";
import { Camera, CalendarRange, MapPin, RefreshCcw, XCircle } from "lucide-react";
import { Card, Button, SectionTitle } from "@silvertrails/ui";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useLocale } from "../contexts/LocaleContext.jsx";
import {
    getMyConfirmedTrails,
    getMyRegistrations,
    listTrails,
    registerForTrail,
} from "../services/trails.js";
import { getMyAttendance } from "../services/leaderboard.js";
import { t, formatDateTime } from "../i18n/index.js";

const ACTIVE_REGISTRATION_STATUSES = new Set(["pending", "approved", "confirmed", "waitlisted"]);

export default function MyTrails() {
    const navigate = useNavigate();
    const { tokens } = useAuth();
    useLocale();
    const accessToken = tokens?.access_token;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [trails, setTrails] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [confirmedTrails, setConfirmedTrails] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [registeringTrailId, setRegisteringTrailId] = useState(null);

    const formatStatusText = (value) => {
        if (!value) {
            return "";
        }
        return String(value)
            .replace(/[_-]+/g, " ")
            .split(" ")
            .map((word) => (word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : ""))
            .join(" ");
    };

    const formatRegistrationStatus = (status) => {
        if (!status) {
            return "";
        }
        const key = `myTrails.status.${String(status).toLowerCase()}`;
        const label = t(key);
        return label === key ? formatStatusText(status) : label;
    };

    const formatTrailStatus = (status) => {
        if (!status) {
            return t("myTrails.available.status.unknown", { status: "" });
        }
        const key = `myTrails.available.status.${String(status).toLowerCase()}`;
        const label = t(key, { status: formatStatusText(status) });
        return label === key ? formatStatusText(status) : label;
    };

    const formatDateRangeValue = (start, end) => {
        const startText = start ? formatDateTime(start, { fallbackKey: "common.labels.toBeConfirmed" }) : null;
        const endText = end ? formatDateTime(end, { fallbackKey: "common.labels.toBeConfirmed" }) : null;
        if (startText && endText) {
            return t("common.labels.dateRange", { start: startText, end: endText });
        }
        if (startText || endText) {
            return startText || endText || "";
        }
        return t("common.labels.toBeConfirmed");
    };

    const fetchAll = useCallback(
        async (signal) => {
            if (!accessToken) {
                return;
            }
            setLoading(true);
            setError("");
            try {
                const [trailsRes, regsRes, confirmedRes, attendanceRes] = await Promise.all([
                    listTrails({ accessToken, signal }),
                    getMyRegistrations({ accessToken, signal }),
                    getMyConfirmedTrails({ accessToken, signal }),
                    getMyAttendance({ accessToken, signal }),
                ]);
                setTrails(trailsRes ?? []);
                setRegistrations(regsRes ?? []);
                setConfirmedTrails(confirmedRes ?? []);
                setAttendance(attendanceRes ?? []);
            } catch (err) {
                if (!(signal?.aborted)) {
                    setError(err?.message ?? t("myTrails.errors.load"));
                }
            } finally {
                if (!(signal?.aborted)) {
                    setLoading(false);
                }
            }
        },
        [accessToken]
    );

    useEffect(() => {
        if (!accessToken) {
            return;
        }
        const controller = new AbortController();
        fetchAll(controller.signal);
        return () => controller.abort();
    }, [accessToken, fetchAll]);

    const trailsById = useMemo(() => {
        const map = new Map();
        trails.forEach((trail) => map.set(trail.id, trail));
        return map;
    }, [trails]);

    const enrichedRegistrations = useMemo(
        () =>
            registrations.map((reg) => ({
                ...reg,
                trail: trailsById.get(reg.trail_id) ?? null,
            })),
        [registrations, trailsById]
    );

    const confirmedCount = useMemo(
        () => enrichedRegistrations.filter((reg) => reg.status === "confirmed").length,
        [enrichedRegistrations]
    );
    const totalRegistrations = enrichedRegistrations.length;
    const progressPct =
        totalRegistrations === 0 ? 0 : Math.round((confirmedCount / totalRegistrations) * 100);

    const joinedTrailIds = useMemo(() => {
        const ids = new Set();
        enrichedRegistrations.forEach((reg) => {
            if (ACTIVE_REGISTRATION_STATUSES.has(reg.status)) {
                ids.add(reg.trail_id);
            }
        });
        return ids;
    }, [enrichedRegistrations]);
    const availableTrails = useMemo(
        () => trails.filter((trail) => !joinedTrailIds.has(trail.id)),
        [trails, joinedTrailIds]
    );

    const attendanceHistory = useMemo(
        () =>
            [...attendance].sort(
                (a, b) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime()
            ),
        [attendance]
    );

    const openTrailDetail = useCallback(
        (trail, registrationData = null) => {
            if (!trail) {
                return;
            }
            navigate(`/mytrails/${trail.id}`, {
                state: {
                    trail,
                    registration: registrationData
                        ? {
                            id: registrationData.id,
                            status: registrationData.status,
                            note: registrationData.note ?? "",
                        }
                        : null,
                },
            });
        },
        [navigate]
    );

    const handleRegister = useCallback(
        async (trailId) => {
            if (!accessToken || !trailId) {
                return;
            }
            setRegisteringTrailId(trailId);
            setError("");
            try {
                await registerForTrail({ accessToken, trailId });
                await fetchAll();
            } catch (err) {
                setError(err?.message ?? t("myTrails.errors.register"));
            } finally {
                setRegisteringTrailId(null);
            }
        },
        [accessToken, fetchAll]
    );

    return (
        <Layout title={t("myTrails.pageTitle")}>
            <div className="space-y-6">
                <Card className="bg-gradient-to-r from-teal-400 to-cyan-400 text-white p-5">
                    <h2 className="text-2xl font-bold mb-1">{t("myTrails.hero.title")}</h2>
                    <p className="opacity-90">{t("myTrails.hero.description")}</p>
                    <div className="mt-4 bg-white/15 rounded-full h-3 overflow-hidden">
                        <div
                            className="h-full bg-white/80 transition-all"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                    <p className="mt-2 text-sm">
                        {t("myTrails.hero.progressSummary", {
                            confirmed: confirmedCount,
                            total: totalRegistrations || 1,
                            percent: progressPct,
                        })}
                    </p>
                </Card>

                {error && (
                    <Card className="border border-rose-200 bg-rose-50 text-rose-700">
                        <div className="flex items-center gap-2">
                            <XCircle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                    </Card>
                )}

                <div className="flex flex-wrap items-center gap-3">
                    <Button onClick={() => fetchAll()} variant="neutral" disabled={loading}>
                        <RefreshCcw className="w-4 h-4" />
                        {t("common.actions.refresh")}
                    </Button>

                    <Button onClick={() => navigate("/scan")} variant="positive">
                        <Camera className="w-4 h-4" />
                        {t("myTrails.actions.scan")}
                    </Button>
                </div>


                <SectionTitle title={t("myTrails.sections.registered")} />
                {loading && enrichedRegistrations.length === 0 ? (
                    <Card className="p-4 text-sm text-gray-600">{t("myTrails.messages.loadingRegistered")}</Card>
                ) : enrichedRegistrations.length === 0 ? (
                    <Card className="p-4 text-sm text-gray-600">
                        {t("myTrails.messages.noRegistrations")}
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {enrichedRegistrations.map((reg) => (
                            <Card key={reg.id} className="p-4 space-y-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-lg">
                                            {reg.trail?.title ?? t("myTrails.labels.trailFallback")}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {reg.trail?.description ?? t("myTrails.messages.trailDescriptionFallback")}
                                        </p>
                                    </div>
                                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-teal-100 text-teal-700 uppercase tracking-wide">
                                        {formatRegistrationStatus(reg.status)}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-3 text-sm text-gray-700">
                                    <span className="flex items-center gap-1">
                                        <CalendarRange className="w-4 h-4 text-teal-500" />
                                        {formatDateRangeValue(reg.trail?.starts_at, reg.trail?.ends_at)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4 text-teal-500" />
                                        {reg.trail?.location ?? t("common.labels.locationTbc")}
                                    </span>
                                </div>
                                {reg.note && (
                                    <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                                        {t("myTrails.messages.registrationNote", { note: reg.note })}
                                    </p>
                                )}
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button
                                        onClick={() =>
                                            openTrailDetail(
                                                reg.trail ?? { id: reg.trail_id, title: t("myTrails.labels.trailFallback") },
                                                reg
                                            )
                                        }
                                        className="bg-white border border-teal-200 text-teal-700 hover:bg-teal-50 text-sm"
                                    >
                                        {t("myTrails.actions.viewDetails")}
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                <SectionTitle title={t("myTrails.sections.attendance")} />
                <Card>
                    {loading && attendance.length === 0 ? (
                        <p className="text-sm text-gray-600">{t("myTrails.messages.loadingAttendance")}</p>
                    ) : attendanceHistory.length === 0 ? (
                        <p className="text-sm text-gray-600">
                            {t("myTrails.messages.noAttendance")}
                        </p>
                    ) : (
                        <ul className="divide-y">
                            {attendanceHistory.slice(0, 10).map((entry) => {
                                const trail = trailsById.get(entry.trail_id);
                                return (
                                    <li key={entry.id} className="py-3 text-sm flex justify-between gap-3">
                                        <div>
                                            <p className="font-medium text-gray-800">
                                                {trail?.title ?? t("myTrails.labels.trailWithIdFallback", {
                                                    id: entry.trail_id.slice(0, 8).toUpperCase(),
                                                })}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatDateTime(entry.checked_at, {
                                                    fallbackKey: "common.pending",
                                                })}
                                            </p>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {t("myTrails.attendance.orgLabel", {
                                                org: entry.org_id.slice(0, 8).toUpperCase(),
                                            })}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </Card>

                <SectionTitle title={t("myTrails.sections.available")} />
                {loading && trails.length === 0 ? (
                    <Card className="p-4 text-sm text-gray-600">{t("myTrails.messages.loadingAvailable")}</Card>
                ) : availableTrails.length === 0 ? (
                    <Card className="p-4 text-sm text-gray-600">
                        {t("myTrails.messages.noAvailable")}
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availableTrails.map((trail) => (
                            <Card key={trail.id} className="p-4 space-y-3">
                                <div>
                                    <h3 className="font-semibold text-lg">{trail.title}</h3>
                                    <p className="text-sm text-gray-600">
                                        {trail.description ?? t("myTrails.messages.availableDescription")}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-3 text-sm text-gray-700">
                                    <span className="flex items-center gap-1">
                                        <CalendarRange className="w-4 h-4 text-teal-500" />
                                        {formatDateRangeValue(trail.starts_at, trail.ends_at)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4 text-teal-500" />
                                        {trail.location ?? t("common.labels.locationTbc")}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">
                                        {t("myTrails.available.capacityStatus", {
                                            capacity:
                                                trail.capacity ?? t("myTrails.available.capacityUnknown"),
                                            status: formatTrailStatus(trail.status),
                                        })}
                                    </span>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => openTrailDetail(trail)}
                                            className="bg-white border border-teal-200 text-teal-700 hover:bg-teal-50 text-sm"
                                        >
                                            {t("myTrails.actions.details")}
                                        </Button>
                                        <Button
                                            onClick={() => handleRegister(trail.id)}
                                            disabled={registeringTrailId === trail.id}
                                            className="bg-teal-500 hover:bg-teal-600 text-white text-sm"
                                        >
                                            {registeringTrailId === trail.id
                                                ? t("myTrails.actions.joining")
                                                : t("myTrails.actions.join")}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {confirmedTrails.length > 0 && (
                    <>
                        <SectionTitle title={t("myTrails.sections.confirmed")} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {confirmedTrails.map((trail) => (
                                <Card key={trail.id} className="p-4 space-y-2">
                                    <h3 className="font-semibold text-lg">{trail.title}</h3>
                                    <p className="text-sm text-gray-600">
                                        {trail.description ?? t("myTrails.messages.trailDescriptionFallback")}
                                    </p>
                                    <div className="flex flex-wrap gap-3 text-sm text-gray-700">
                                        <span className="flex items-center gap-1">
                                            <CalendarRange className="w-4 h-4 text-teal-500" />
                                            {formatDateRangeValue(trail.starts_at, trail.ends_at)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4 text-teal-500" />
                                            {trail.location ?? t("common.labels.locationTbc")}
                                        </span>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            onClick={() => openTrailDetail(trail)}
                                            className="bg-white border border-teal-200 text-teal-700 hover:bg-teal-50 text-sm"
                                        >
                                            {t("myTrails.actions.viewDetails")}
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
}
