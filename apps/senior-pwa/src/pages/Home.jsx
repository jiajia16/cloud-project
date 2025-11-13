import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useLocale } from "../contexts/LocaleContext.jsx";
import { useNavigate } from "react-router-dom";
import { Button } from "@silvertrails/ui";
import LanguageSelector from "../components/LanguageSelector.jsx";
import {
    Trophy,
    Gift,
    Calendar,
    BookOpen,
    LogOut,
    User,
    Lightbulb,
    RefreshCcw,
    CalendarRange,
    MapPin,
} from "lucide-react";
import {
    getMyConfirmedTrails,
    getMyRegistrations,
    listTrails,
    previewInvite,
    acceptInvite,
} from "../services/trails.js";
import { listOrganisations, selfJoinOrganisation } from "../services/auth.js";
import {
    consumePendingInviteToken,
    consumePendingInviteResult,
} from "../utils/pendingInvite.js";
import { t, formatDateTime } from "../i18n/index.js";

const ACTIVE_REGISTRATION_STATUSES = new Set(["pending", "approved", "confirmed", "waitlisted"]);

export default function Home() {
    const { user, logout, tokens, refreshSession } = useAuth();
    const { locale } = useLocale();
    const navigate = useNavigate();
    const accessToken = tokens?.access_token;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [registrations, setRegistrations] = useState([]);
    const [confirmedTrails, setConfirmedTrails] = useState([]);
    const [availableTrails, setAvailableTrails] = useState([]);
    const [inviteToken, setInviteToken] = useState("");
    const [invitePreview, setInvitePreview] = useState(null);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteSubmitting, setInviteSubmitting] = useState(false);
    const [inviteError, setInviteError] = useState("");
    const [inviteSuccess, setInviteSuccess] = useState("");
    const [orgOptions, setOrgOptions] = useState([]);
    const [orgLoading, setOrgLoading] = useState(false);
    const [orgError, setOrgError] = useState("");
    const [selectedOrg, setSelectedOrg] = useState("");
    const [joinLoading, setJoinLoading] = useState(false);
    const [joinSuccessMessage, setJoinSuccessMessage] = useState("");

    const highlights = useMemo(
        () => [
            {
                title: t("home.highlights.taiChi.title"),
                subtitle: t("home.highlights.taiChi.subtitle"),
                desc: t("home.highlights.taiChi.description"),
                color: "bg-cyan-300",
            },
            {
                title: t("home.highlights.cooking.title"),
                subtitle: t("home.highlights.cooking.subtitle"),
                desc: t("home.highlights.cooking.description"),
                color: "bg-orange-300",
            },
            {
                title: t("home.highlights.garden.title"),
                subtitle: t("home.highlights.garden.subtitle"),
                desc: t("home.highlights.garden.description"),
                color: "bg-cyan-300",
            },
        ],
        [locale],
    );

    const inviteTrail = useMemo(() => {
        if (!invitePreview) {
            return null;
        }
        if (invitePreview.trail) {
            return invitePreview.trail;
        }
        return invitePreview;
    }, [invitePreview]);

    useEffect(() => {
        const pendingOrg = !user?.org_ids || user.org_ids.length === 0;
        if (!pendingOrg || !accessToken) {
            setOrgOptions([]);
            setOrgError("");
            setSelectedOrg("");
            setJoinSuccessMessage("");
            return;
        }
        setOrgLoading(true);
        setOrgError("");
        setJoinSuccessMessage("");
        listOrganisations({ accessToken })
            .then((orgs) => {
                setOrgOptions(Array.isArray(orgs) ? orgs : []);
            })
            .catch((err) => {
                setOrgError(err?.message ?? t("common.errors.organisationsLoad"));
                setOrgOptions([]);
            })
            .finally(() => {
                setOrgLoading(false);
            });
    }, [accessToken, user?.org_ids]);

    const fetchData = useCallback(
        async (signal) => {
            if (!accessToken) {
                return;
            }
            setLoading(true);
            setError("");
            try {
                const [trailsRes, regsRes, confirmedRes] = await Promise.all([
                    listTrails({ accessToken, signal }),
                    getMyRegistrations({ accessToken, signal }),
                    getMyConfirmedTrails({ accessToken, signal }),
                ]);

                const regs = regsRes ?? [];
                const trails = trailsRes ?? [];
                const confirmed = confirmedRes ?? [];

                const joinedIds = new Set(
                    regs
                        .filter((reg) => ACTIVE_REGISTRATION_STATUSES.has(reg.status))
                        .map((reg) => reg.trail_id)
                );
                const upcoming = trails
                    .filter((trail) => !joinedIds.has(trail.id))
                    .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));

                setRegistrations(regs);
                setConfirmedTrails(confirmed);
                setAvailableTrails(upcoming);
            } catch (err) {
                if (!(signal?.aborted)) {
                    setError(err?.message ?? t("common.errors.trailsLoad"));
                }
            } finally {
                if (!(signal?.aborted)) {
                    setLoading(false);
                }
            }
        },
        [accessToken]
    );

    const handlePreviewInvite = useCallback(async () => {
        if (!accessToken) {
            setInviteError(t("common.errors.inviteSignIn"));
            return;
        }
        const trimmed = inviteToken.trim();
        if (!trimmed) {
            setInviteError(t("common.errors.inviteRequired"));
            return;
        }
        setInviteLoading(true);
        setInviteSubmitting(false);
        setInviteError("");
        setInviteSuccess("");
        setInvitePreview(null);
        try {
            const preview = await previewInvite({ accessToken, token: trimmed });
            setInvitePreview(preview ?? null);
        } catch (err) {
            setInviteError(err?.message ?? t("common.errors.invitePreview"));
        } finally {
            setInviteLoading(false);
        }
    }, [accessToken, inviteToken]);

    const handleAcceptInvite = useCallback(async () => {
        if (!accessToken) {
            setInviteError(t("common.errors.inviteSignIn"));
            return;
        }
        const trimmed = inviteToken.trim();
        if (!trimmed) {
            setInviteError(t("common.errors.inviteRequired"));
            return;
        }
        if (!invitePreview) {
            setInviteError(t("common.errors.invitePreviewRequired"));
            return;
        }
        setInviteSubmitting(true);
        setInviteError("");
        try {
            await acceptInvite({ accessToken, token: trimmed });
            const joinedTitle =
                invitePreview?.trail?.title ??
                (typeof invitePreview?.title === "string" ? invitePreview.title : undefined);
            setInviteSuccess(
                t("common.success.inviteRegistered", {
                    title: joinedTitle ?? t("home.invite.fallbackTitle"),
                }),
            );
            setInvitePreview(null);
            setInviteToken("");
            await fetchData();
        } catch (err) {
            setInviteError(err?.message ?? t("common.errors.inviteJoin"));
        } finally {
            setInviteSubmitting(false);
        }
    }, [accessToken, fetchData, invitePreview, inviteToken]);



    useEffect(() => {
        if (!accessToken) {
            return;
        }
        const controller = new AbortController();
        fetchData(controller.signal);
        return () => controller.abort();
    }, [accessToken, fetchData]);

    useEffect(() => {
        const result = consumePendingInviteResult();
        if (!result) {
            return;
        }
        if (result.status === "success") {
            const title =
                result?.trailTitle && typeof result.trailTitle === "string"
                    ? result.trailTitle
                    : "";
            setInviteSuccess(
                title
                    ? t("common.success.inviteRegistered", { title })
                    : t("home.invite.acceptedGeneric")
            );
            fetchData().catch(() => {});
        } else if (result.status === "error") {
            setInviteError(result.message ?? t("home.invite.processError"));
        }
    }, [fetchData]);

    useEffect(() => {
        if (!accessToken) {
            return;
        }
        const pending = consumePendingInviteToken();
        if (!pending) {
            return;
        }
        let cancelled = false;
        const controller = new AbortController();

        const processInvite = async () => {
            setInviteToken(pending);
            setInviteError("");
            setInviteSuccess("");
            setInviteLoading(true);
            try {
                const inviteData = await previewInvite({
                    accessToken,
                    token: pending,
                    signal: controller.signal,
                });
                if (cancelled) {
                    return;
                }
                setInvitePreview(inviteData);

                let alreadyRegistered = false;
                try {
                    await acceptInvite({
                        accessToken,
                        token: pending,
                        signal: controller.signal,
                    });
                } catch (joinErr) {
                    if (cancelled || joinErr?.name === "AbortError") {
                        return;
                    }
                    const message = joinErr?.message ?? "";
                    if (/already registered/i.test(message)) {
                        alreadyRegistered = true;
                    } else {
                        setInviteError(message || t("common.errors.inviteGeneric"));
                        return;
                    }
                }

                if (cancelled) {
                    return;
                }

                const title =
                    inviteData?.trail?.title ??
                    (typeof inviteData?.title === "string" ? inviteData.title : "");
                if (alreadyRegistered) {
                    setInviteSuccess(
                        title
                            ? t("home.invite.alreadyRegisteredWithTitle", { title })
                            : t("home.invite.alreadyRegisteredGeneric"),
                    );
                } else {
                    setInviteSuccess(
                        title
                            ? t("common.success.inviteRegistered", { title })
                            : t("home.invite.acceptedGeneric"),
                    );
                }

                try {
                    await fetchData(controller.signal);
                } catch {
                    // ignore refresh errors triggered by invite auto-join
                }
            } catch (err) {
                if (cancelled || err?.name === "AbortError") {
                    return;
                }
                setInviteError(err?.message ?? t("home.invite.scannedError"));
            } finally {
                if (!cancelled) {
                    setInviteLoading(false);
                }
            }
        };

        processInvite();

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [accessToken, fetchData]);

    const confirmedCount = useMemo(
        () => registrations.filter((reg) => reg.status === "confirmed").length,
        [registrations]
    );
    const totalRegistrations = registrations.length;
    const progressPct = totalRegistrations === 0 ? 0 : Math.round((confirmedCount / totalRegistrations) * 100);
    const upcomingTrails = useMemo(() => availableTrails.slice(0, 4), [availableTrails]);
    const pendingOrgAssignment =
        !!user && (!Array.isArray(user.org_ids) || user.org_ids.length === 0);

    const handleLogout = useCallback(async () => {
        await logout();
        navigate("/login", { replace: true });
    }, [logout, navigate]);

    return (
        <div className="min-h-screen bg-cyan-50 flex flex-col items-center py-6 font-sans">
            <div className="w-full max-w-3xl flex justify-between items-center px-6 py-3 bg-white rounded-2xl shadow-sm">
                <h1 className="text-xl font-bold text-cyan-700">{t("common.appName")}</h1>
                <div className="flex items-center gap-3">
                    <LanguageSelector />
                    <button
                        type="button"
                        className="flex items-center justify-center w-8 h-8 bg-cyan-100 rounded-full hover:bg-cyan-200 transition"
                        onClick={() => alert(t("home.profile.comingSoon"))}
                    >
                        <User className="w-5 h-5 text-cyan-700" />
                    </button>
                    <button
                        type="button"
                        className="flex items-center gap-1 text-sm bg-rose-100 px-3 py-1 rounded-xl text-rose-600 hover:bg-rose-200 transition"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-4 h-4" />
                        {t("common.actions.logout")}
                    </button>
                </div>
            </div>

            {pendingOrgAssignment && (
                <div
                    className="w-full max-w-3xl mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-amber-900 shadow-sm space-y-3"
                    role="alert"
                >
                    <div>
                        <h2 className="text-lg font-semibold">{t("home.pendingOrg.title")}</h2>
                        <p className="mt-1 text-sm leading-5">{t("home.pendingOrg.description")}</p>
                    </div>
                    <div className="flex flex-col gap-3 md:flex-row md:items-end">
                        <label className="flex-1 text-xs font-semibold text-amber-900">
                            {t("home.pendingOrg.selectLabel")}
                            <select
                                value={selectedOrg}
                                onChange={(event) => setSelectedOrg(event.target.value)}
                                className="mt-2 w-full rounded-xl border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
                                disabled={orgLoading || joinLoading}
                            >
                                <option value="">{t("home.pendingOrg.selectPlaceholder")}</option>
                                {orgOptions.map((org) => (
                                    <option key={org.id} value={org.id}>
                                        {org.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <Button
                            onClick={async () => {
                                if (!selectedOrg) {
                                    setOrgError(t("common.errors.selectOrganisation"));
                                    return;
                                }
                                if (!accessToken) {
                                    setOrgError(t("common.errors.reauth"));
                                    return;
                                }
                                setJoinLoading(true);
                                setOrgError("");
                                setJoinSuccessMessage("");
                                try {
                                    await selfJoinOrganisation({ accessToken, orgId: selectedOrg });
                                    setJoinSuccessMessage(t("home.pendingOrg.success"));
                                    await refreshSession();
                                    await fetchData();
                                } catch (err) {
                                    setOrgError(
                                        err?.message ?? t("common.errors.joinOrganisation"),
                                    );
                                } finally {
                                    setJoinLoading(false);
                                }
                            }}
                            disabled={joinLoading || orgLoading}
                            className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-xl"
                        >
                            {joinLoading ? t("home.pendingOrg.joining") : t("home.pendingOrg.cta")}
                        </Button>
                    </div>
                    {orgError && <p className="text-xs text-rose-600">{orgError}</p>}
                    {joinSuccessMessage && <p className="text-xs text-emerald-700">{joinSuccessMessage}</p>}
                </div>
            )}

            <div className="w-full max-w-3xl mt-6 bg-gradient-to-r from-cyan-400 to-teal-400 text-white p-6 rounded-2xl shadow-md">
                <h2 className="text-2xl font-bold">
                    {t("home.hero.title", { name: user?.name ?? t("common.friend") })}
                </h2>
                <p className="text-cyan-50 mt-2">{t("home.hero.subtitle")}</p>
            </div>

            <div className="w-full max-w-3xl bg-white p-4 mt-4 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-2 text-gray-700 font-semibold">
                    <span>{t("home.progress.title")}</span>
                    <span className="text-cyan-600">
                        {t("home.progress.summary", {
                            confirmed: confirmedCount,
                            total: totalRegistrations || 1,
                        })}
                    </span>
                </div>
                <div className="flex justify-between text-gray-700 font-semibold mb-2">
                    <span className="text-sm text-gray-500">{t("home.progress.note")}</span>
                    <button
                        type="button"
                        onClick={() => fetchData()}
                        className="flex items-center gap-1 text-sm text-cyan-700 hover:text-cyan-800"
                        disabled={loading}
                    >
                        <RefreshCcw className="w-4 h-4" />
                        {t("common.actions.refresh")}
                    </button>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full">
                    <div
                        className="h-3 bg-cyan-400 rounded-full transition-all"
                        style={{ width: `${progressPct}%` }}
                    />
                </div>
                {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
            </div>

            <div className="w-full max-w-3xl grid grid-cols-2 gap-4 mt-4">
                <Card
                    icon={<BookOpen className="w-6 h-6 text-pink-500" />}
                    title={t("home.links.myTrails.title")}
                    desc={t("home.links.myTrails.description")}
                    onClick={() => navigate("/mytrails")}
                />
                <Card
                    icon={<Trophy className="w-6 h-6 text-yellow-500" />}
                    title={t("home.links.leaderboard.title")}
                    desc={t("home.links.leaderboard.description")}
                    onClick={() => navigate("/leaderboard")}
                />
                <Card
                    icon={<Gift className="w-6 h-6 text-red-500" />}
                    title={t("home.links.rewards.title")}
                    desc={t("home.links.rewards.description")}
                    onClick={() => navigate("/rewards")}
                />
                <Card
                    icon={<Calendar className="w-6 h-6 text-purple-500" />}
                    title={t("home.links.upcoming.title")}
                    desc={t("home.links.upcoming.description")}
                    onClick={() => alert(t("home.links.upcomingComingSoon"))}
                />
            </div>

            <div className="w-full max-w-3xl mt-6 bg-white p-5 rounded-2xl shadow-sm">
                <h3 className="text-gray-800 font-bold text-lg">{t("home.invite.sectionTitle")}</h3>
                <p className="text-sm text-gray-600 mt-1">
                    {t("home.invite.sectionSubtitle")}
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                        type="text"
                        value={inviteToken}
                        onChange={(event) => {
                            setInviteToken(event.target.value);
                            setInviteError("");
                            setInviteSuccess("");
                            setInvitePreview(null);
                        }}
                        className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200"
                        placeholder={t("home.invite.placeholder")}
                        autoComplete="off"
                    />
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handlePreviewInvite}
                            disabled={inviteLoading}
                            className="px-4 py-2 rounded-xl border border-cyan-300 text-sm font-semibold text-cyan-700 hover:bg-cyan-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {inviteLoading ? t("home.invite.previewLoading") : t("home.invite.previewCta")}
                        </button>
                        <button
                            type="button"
                            onClick={handleAcceptInvite}
                            disabled={inviteSubmitting || !invitePreview}
                            className="px-4 py-2 rounded-xl bg-cyan-500 text-white text-sm font-semibold hover:bg-cyan-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                        >
                            {inviteSubmitting ? t("home.invite.joining") : t("home.invite.joinCta")}
                        </button>
                    </div>
                </div>
                {inviteError && <p className="mt-3 text-sm text-rose-600">{inviteError}</p>}
                {inviteSuccess && <p className="mt-3 text-sm text-emerald-600">{inviteSuccess}</p>}
                {invitePreview && inviteTrail ? (
                    <div className="mt-4 rounded-xl border border-cyan-100 bg-cyan-50 p-4 text-sm text-gray-700">
                        <p className="text-base font-semibold text-gray-800">{inviteTrail.title}</p>
                        <p className="mt-1">{inviteTrail.description ?? t("home.invite.descriptionFallback")}</p>
                        <div className="mt-3 space-y-1">
                            <div className="flex items-center gap-2 text-gray-600">
                                <CalendarRange className="w-4 h-4 text-cyan-600" />
                                <span>
                                    {t("common.labels.dateRange", {
                                        start: formatDateTime(inviteTrail.starts_at),
                                        end: formatDateTime(inviteTrail.ends_at),
                                    })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <MapPin className="w-4 h-4 text-cyan-600" />
                                <span>{inviteTrail.location ?? t("common.labels.locationTbc")}</span>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            <div className="w-full max-w-3xl mt-6 bg-white p-5 rounded-2xl shadow-sm">
                <h3 className="text-gray-800 font-bold text-lg mb-4">{t("home.upcoming.title")}</h3>
                {loading && upcomingTrails.length === 0 ? (
                    <p className="text-sm text-gray-500">{t("home.upcoming.loading")}</p>
                ) : upcomingTrails.length === 0 ? (
                    <p className="text-sm text-gray-500">
                        {t("home.upcoming.empty")}
                    </p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {upcomingTrails.map((trail) => (
                            <div key={trail.id} className="border border-gray-100 rounded-xl p-4 bg-cyan-50/60">
                                <h4 className="font-semibold text-gray-800">{trail.title}</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                    {trail.description ?? t("home.upcoming.descriptionFallback")}
                                </p>
                                <div className="mt-3 space-y-1 text-sm text-gray-700">
                                    <div className="flex items-center gap-2">
                                        <CalendarRange className="w-4 h-4 text-cyan-600" />
                                        <span>
                                            {t("common.labels.dateRange", {
                                                start: formatDateTime(trail.starts_at),
                                                end: formatDateTime(trail.ends_at),
                                            })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-cyan-600" />
                                        <span>{trail.location ?? t("common.labels.toBeConfirmed")}</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => navigate("/mytrails")}
                                    className="mt-3 text-sm text-cyan-700 hover:text-cyan-800 font-semibold"
                                >
                                    {t("home.upcoming.viewDetails")} {"\u2192"}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="w-full max-w-3xl bg-orange-100 mt-6 p-5 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                    <Lightbulb className="w-6 h-6 text-orange-500" />
                    <h3 className="text-orange-600 font-bold text-lg">{t("home.daily.title")}</h3>
                </div>
                <p className="text-gray-700 mt-2">
                    {t("home.daily.body")}
                </p>
                <button className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition">
                    {t("home.daily.cta")}
                </button>
            </div>

            <div className="w-full max-w-3xl mt-6 bg-white p-5 rounded-2xl shadow-sm">
                <h3 className="text-gray-800 font-bold text-lg mb-4">
                    {t("home.sections.highlightsTitle")}
                </h3>
                <div className="grid grid-cols-3 gap-4">
                    {highlights.map((highlight, index) => (
                        <div key={index} className={`${highlight.color} text-white p-4 rounded-2xl text-center shadow-sm`}>
                            <h4 className="text-lg font-bold mb-2">{highlight.title}</h4>
                            <p className="text-sm">{highlight.subtitle}</p>
                            <p className="text-xs text-white/90 mt-1">{highlight.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function Card({ icon, title, desc, onClick }) {
    return (
        <button
            onClick={onClick}
            className="bg-white rounded-2xl p-5 shadow-sm text-left hover:bg-cyan-50 transition flex flex-col justify-between"
        >
            <div className="flex items-center gap-3 mb-2">
                {icon}
                <h3 className="text-gray-800 font-bold text-lg">{title}</h3>
            </div>
            <p className="text-gray-600 text-sm">{desc}</p>
        </button>
    );
}


















