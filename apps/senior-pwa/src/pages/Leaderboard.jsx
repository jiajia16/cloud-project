import React, { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout.jsx";
import { Card, Tabs, Button } from "@silvertrails/ui";
import { Medal, RefreshCcw, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useLocale } from "../contexts/LocaleContext.jsx";
import { formatPoints } from "@silvertrails/utils";
import { getSystemLeaderboard, getOrgLeaderboard } from "../services/leaderboard.js";
import { listOrganisations } from "../services/auth.js";
import { t } from "../i18n/index.js";

const TAB_KEYS = {
    system: "system",
    org: "org",
};

function displayName(entry, currentUserId) {
    if (!entry?.user_id) {
        return "";
    }
    if (entry.user_id === currentUserId) {
        return t("leaderboard.entries.you");
    }
    if (entry.user_name) {
        return entry.user_name;
    }
    if (entry.name) {
        return entry.name;
    }
    return t("leaderboard.entries.participantLabel", {
        id: entry.user_id.slice(0, 6).toUpperCase(),
    });
}

function formatOrgLabel(orgId, orgNameMap) {
    if (!orgId) {
        return t("leaderboard.org.unknown");
    }
    if (orgNameMap && orgNameMap[orgId]) {
        return orgNameMap[orgId];
    }
    return t("leaderboard.org.label", { id: orgId.slice(0, 8).toUpperCase() });
}

function LeaderboardBlocks({
    leaders,
    loading,
    error,
    onRefresh,
    emptyMessage,
    currentUserId,
}) {
    const hasEntries = leaders.length > 0;
    const topThree = leaders.slice(0, 3);
    const highlightEntry = currentUserId
        ? leaders.find((entry) => entry.user_id === currentUserId)
        : null;
    const highlightRank = highlightEntry?.rank ?? null;

    return (
        <>
            <Card className="mb-3 mt-4">
                {loading && !hasEntries ? (
                    <p className="text-sm text-gray-600">{t("leaderboard.blocks.loading")}</p>
                ) : error && !hasEntries ? (
                    <div className="flex items-center gap-2 text-sm text-rose-600">
                        <AlertCircle className="w-4 h-4" />
                        <span>{error}</span>
                    </div>
                ) : topThree.length === 0 ? (
                    <p className="text-sm text-gray-600">{emptyMessage}</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                        {topThree.map((entry, index) => {
                            const medalColors = [
                                "text-yellow-400",
                                "text-gray-400",
                                "text-amber-700",
                            ];
                            return (
                                <div key={entry.user_id} className="p-3">
                                    <Medal
                                        className={`w-10 h-10 mx-auto ${
                                            medalColors[index] ?? "text-teal-500"
                                        }`}
                                    />
                                    <div className="font-semibold mt-2">
                                        {displayName(entry, currentUserId)}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {t("leaderboard.blocks.rank", { rank: entry.rank })}
                                    </div>
                                    <div className="text-teal-600 font-bold mt-1">
                                        {formatPoints(entry.score)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            <Card>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                        {t("leaderboard.blocks.title")}
                    </h3>
                    <Button
                        onClick={() => onRefresh?.()}
                        disabled={loading}
                        className="bg-white border border-teal-200 text-teal-700 hover:bg-teal-50 text-sm flex items-center gap-2"
                    >
                        <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        {loading
                            ? t("leaderboard.blocks.refreshing")
                            : t("leaderboard.blocks.refresh")}
                    </Button>
                </div>
                {error && hasEntries && (
                    <div className="mb-3 text-sm text-rose-600 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>{error}</span>
                    </div>
                )}
                {!hasEntries ? (
                    <p className="text-sm text-gray-600">{emptyMessage}</p>
                ) : (
                    <ul className="divide-y">
                        {leaders.map((entry) => {
                            const isCurrentUser = entry.user_id === currentUserId;
                            return (
                                <li
                                    key={`${entry.user_id}-${entry.rank}`}
                                    className={`py-3 flex items-center justify-between ${
                                        isCurrentUser ? "bg-teal-50 px-3 rounded-lg" : ""
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold">
                                            {entry.rank}
                                        </div>
                                        <span
                                            className={`font-medium ${
                                                isCurrentUser ? "text-teal-700" : "text-gray-800"
                                            }`}
                                        >
                                            {displayName(entry, currentUserId)}
                                        </span>
                                    </div>
                                    <span className="font-semibold text-gray-800">
                                        {formatPoints(entry.score)}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                )}
                {highlightRank && (
                    <p className="mt-3 text-sm text-gray-600 text-center">
                        {t("leaderboard.blocks.keepGoing", { rank: highlightRank })}
                    </p>
                )}
            </Card>
        </>
    );
}

export default function Leaderboard() {
    const { tokens, user } = useAuth();
    const accessToken = tokens?.access_token;
    const { locale } = useLocale();

    const [activeTab, setActiveTab] = useState(TAB_KEYS.system);

    const [systemLeaders, setSystemLeaders] = useState([]);
    const [systemLoading, setSystemLoading] = useState(false);
    const [systemError, setSystemError] = useState("");

    const orgIds = user?.org_ids ?? [];
    const [selectedOrgId, setSelectedOrgId] = useState(() => orgIds[0] ?? null);

    useEffect(() => {
        if (!orgIds || orgIds.length === 0) {
            setSelectedOrgId(null);
            return;
        }
        if (!selectedOrgId || !orgIds.includes(selectedOrgId)) {
            setSelectedOrgId(orgIds[0]);
        }
    }, [orgIds, selectedOrgId]);

    const [orgLeaders, setOrgLeaders] = useState([]);
    const [orgLoading, setOrgLoading] = useState(false);
    const [orgError, setOrgError] = useState("");
    const [orgNameMap, setOrgNameMap] = useState({});

    useEffect(() => {
        if (!accessToken) {
            setOrgNameMap({});
            return;
        }
        let cancelled = false;
        listOrganisations({ accessToken })
            .then((orgs) => {
                if (cancelled) {
                    return;
                }
                const map = {};
                if (Array.isArray(orgs)) {
                    orgs.forEach((org) => {
                        if (org?.id) {
                            map[org.id] = org.name || org.id;
                        }
                    });
                }
                setOrgNameMap(map);
            })
            .catch(() => {
                if (!cancelled) {
                    setOrgNameMap({});
                }
            });
        return () => {
            cancelled = true;
        };
    }, [accessToken]);

    const fetchSystemLeaders = useCallback(
        async ({ signal } = {}) => {
            if (!accessToken) {
                return;
            }
            setSystemLoading(true);
            setSystemError("");
            try {
                const data = await getSystemLeaderboard({ accessToken, signal, limit: 50 });
                if (signal?.aborted) {
                    return;
                }
                setSystemLeaders(Array.isArray(data) ? data : []);
            } catch (err) {
                if (!(signal?.aborted)) {
                    setSystemError(err?.message ?? t("leaderboard.errors.systemLoad"));
                }
            } finally {
                if (!(signal?.aborted)) {
                    setSystemLoading(false);
                }
            }
        },
        [accessToken]
    );

    const fetchOrgLeaders = useCallback(
        async ({ signal } = {}) => {
            if (!accessToken || !selectedOrgId) {
                return;
            }
            setOrgLoading(true);
            setOrgError("");
            try {
                const data = await getOrgLeaderboard({
                    accessToken,
                    orgId: selectedOrgId,
                    signal,
                    limit: 50,
                });
                if (signal?.aborted) {
                    return;
                }
                setOrgLeaders(Array.isArray(data) ? data : []);
            } catch (err) {
                if (!(signal?.aborted)) {
                    setOrgError(
                        err?.message ?? t("leaderboard.errors.orgLoad")
                    );
                }
            } finally {
                if (!(signal?.aborted)) {
                    setOrgLoading(false);
                }
            }
        },
        [accessToken, selectedOrgId]
    );

    useEffect(() => {
        if (!accessToken) {
            setSystemLeaders([]);
            setSystemError("");
            setSystemLoading(false);
            return;
        }
        const controller = new AbortController();
        fetchSystemLeaders({ signal: controller.signal });
        return () => controller.abort();
    }, [accessToken, fetchSystemLeaders]);

    useEffect(() => {
        if (!selectedOrgId) {
            setOrgLeaders([]);
            setOrgError("");
            setOrgLoading(false);
            return;
        }
        if (activeTab !== TAB_KEYS.org || !accessToken) {
            return;
        }
        const controller = new AbortController();
        fetchOrgLeaders({ signal: controller.signal });
        return () => controller.abort();
    }, [activeTab, accessToken, selectedOrgId, fetchOrgLeaders]);

    useEffect(() => {
        if (!accessToken) {
            setOrgLeaders([]);
            setOrgError("");
            setOrgLoading(false);
        }
    }, [accessToken]);

    const selectedOrgLabel = useMemo(
        () => formatOrgLabel(selectedOrgId, orgNameMap),
        [selectedOrgId, orgNameMap, locale],
    );

    const tabDefs = useMemo(
        () => [
            { key: TAB_KEYS.system, label: t("leaderboard.tabs.system") },
            { key: TAB_KEYS.org, label: t("leaderboard.tabs.org") },
        ],
        [locale]
    );

    const activeTabLabel = useMemo(
        () => tabDefs.find((def) => def.key === activeTab)?.label ?? tabDefs[0]?.label ?? "",
        [tabDefs, activeTab]
    );

    const handleTabChange = useCallback(
        (label) => {
            const match = tabDefs.find((def) => def.label === label);
            if (match) {
                setActiveTab(match.key);
            }
        },
        [tabDefs]
    );

    const renderOrgLeaderboard = () => {
        if (!orgIds || orgIds.length === 0) {
            return (
                <Card className="mt-4 p-5 text-sm text-gray-600">
                    {t("leaderboard.org.noOrgMessage")}
                </Card>
            );
        }

        return (
            <>
                <Card className="mt-4 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-500">{t("leaderboard.org.currentLabel")}</p>
                        <p className="text-lg font-semibold text-gray-800">{selectedOrgLabel}</p>
                    </div>
                    {orgIds.length > 1 && (
                        <div className="text-sm">
                            <label className="block text-xs text-gray-500 uppercase mb-1">
                                {t("leaderboard.org.switchLabel")}
                            </label>
                            <select
                                value={selectedOrgId ?? ""}
                                onChange={(event) => setSelectedOrgId(event.target.value || null)}
                                className="border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-200"
                            >
                                {orgIds.map((orgId) => (
                                    <option key={orgId} value={orgId}>
                                        {formatOrgLabel(orgId, orgNameMap)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </Card>

                <LeaderboardBlocks
                    leaders={orgLeaders}
                    loading={orgLoading}
                    error={orgError}
                    onRefresh={() => fetchOrgLeaders()}
                    emptyMessage={t("leaderboard.blocks.emptyOrg")}
                    currentUserId={user?.id}
                />
            </>
        );
    };

    return (
        <Layout title={t("leaderboard.pageTitle")}>
            <div className="pb-24 px-4 space-y-4">
                <Tabs
                    tabs={tabDefs.map((def) => def.label)}
                    active={activeTabLabel}
                    onChange={handleTabChange}
                    className="text-gray-800 font-medium"
                />

                {!accessToken ? (
                    <Card className="p-4 text-sm text-gray-600">
                        {t("leaderboard.signInPrompt")}
                    </Card>
                ) : activeTab === TAB_KEYS.system ? (
                    <LeaderboardBlocks
                        leaders={systemLeaders}
                        loading={systemLoading}
                        error={systemError}
                        onRefresh={() => fetchSystemLeaders()}
                        emptyMessage={t("leaderboard.blocks.emptySystem")}
                        currentUserId={user?.id}
                    />
                ) : (
                    renderOrgLeaderboard()
                )}
            </div>
        </Layout>
    );
}
