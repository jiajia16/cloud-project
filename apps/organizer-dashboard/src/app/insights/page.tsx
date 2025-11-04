"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Trophy, Users, Clock, RefreshCw } from "lucide-react";
import { Button, Card } from "@silvertrails/ui";
import { useAuth } from "../../context/AuthContext";
import {
    getOrgLeaderboard,
    getSystemLeaderboard,
    getTrailAttendance,
    type LeaderboardRow,
    type AttendanceEntry,
} from "../../services/leaderboard";
import { listTrails, type Trail } from "../../services/trails";

type LoadingState = {
    loading: boolean;
    error: string | null;
};

function formatUserId(value: string) {
    if (!value) {
        return "Unknown";
    }
    if (value.length <= 12) {
        return value;
    }
    return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

function formatDateTime(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return new Intl.DateTimeFormat("en-SG", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

export default function InsightsPage() {
    const { user, tokens } = useAuth();
    const accessToken = tokens?.access_token ?? null;
    const orgIds = user?.org_ids ?? [];

    const [systemRows, setSystemRows] = useState<LeaderboardRow[]>([]);
    const [orgRows, setOrgRows] = useState<LeaderboardRow[]>([]);
    const [trails, setTrails] = useState<Trail[]>([]);
    const [attendanceRows, setAttendanceRows] = useState<AttendanceEntry[]>([]);

    const [selectedOrgId, setSelectedOrgId] = useState(() => orgIds[0] ?? "");
    const [selectedTrailId, setSelectedTrailId] = useState<string>("");

    const [systemState, setSystemState] = useState<LoadingState>({ loading: false, error: null });
    const [orgState, setOrgState] = useState<LoadingState>({ loading: false, error: null });
    const [attendanceState, setAttendanceState] = useState<LoadingState>({ loading: false, error: null });

    const [systemReloadToken, setSystemReloadToken] = useState(0);
    const [orgReloadToken, setOrgReloadToken] = useState(0);
    const [attendanceReloadToken, setAttendanceReloadToken] = useState(0);

    useEffect(() => {
        if (!selectedOrgId && orgIds.length > 0) {
            setSelectedOrgId(orgIds[0]);
        }
    }, [orgIds, selectedOrgId]);

    useEffect(() => {
        if (!accessToken) {
            setSystemRows([]);
            return;
        }
        const controller = new AbortController();
        setSystemState({ loading: true, error: null });
        getSystemLeaderboard({ accessToken, limit: 10, signal: controller.signal })
            .then((rows) => {
                setSystemRows(rows);
            })
            .catch((error) => {
                if (controller.signal.aborted) {
                    return;
                }
                setSystemState({ loading: false, error: error instanceof Error ? error.message : "Unable to load system leaderboard." });
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setSystemState((prev) => ({ ...prev, loading: false }));
                }
            });
        return () => controller.abort();
    }, [accessToken, systemReloadToken]);

    useEffect(() => {
        if (!accessToken || !selectedOrgId) {
            setOrgRows([]);
            setTrails([]);
            setSelectedTrailId("");
            return;
        }
        const controller = new AbortController();
        setOrgState({ loading: true, error: null });
        Promise.all([
            getOrgLeaderboard({ accessToken, orgId: selectedOrgId, limit: 10, signal: controller.signal }),
            listTrails({ accessToken, orgId: selectedOrgId, signal: controller.signal }),
        ])
            .then(([rows, trailList]) => {
                setOrgRows(rows);
                setTrails(trailList);
                if (trailList.length > 0 && !trailList.some((trail) => trail.id === selectedTrailId)) {
                    setSelectedTrailId(trailList[0].id);
                }
                if (trailList.length === 0) {
                    setSelectedTrailId("");
                }
            })
            .catch((error) => {
                if (controller.signal.aborted) {
                    return;
                }
                setOrgState({ loading: false, error: error instanceof Error ? error.message : "Unable to load organisation leaderboard." });
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setOrgState((prev) => ({ ...prev, loading: false }));
                }
            });
        return () => controller.abort();
    }, [accessToken, selectedOrgId, orgReloadToken]);

    useEffect(() => {
        if (!accessToken || !selectedOrgId || !selectedTrailId) {
            setAttendanceRows([]);
            return;
        }
        const controller = new AbortController();
        setAttendanceState({ loading: true, error: null });
        getTrailAttendance({ accessToken, trailId: selectedTrailId, orgId: selectedOrgId, signal: controller.signal })
            .then((rows) => {
                setAttendanceRows(rows);
            })
            .catch((error) => {
                if (controller.signal.aborted) {
                    return;
                }
                setAttendanceState({ loading: false, error: error instanceof Error ? error.message : "Unable to load attendance." });
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setAttendanceState((prev) => ({ ...prev, loading: false }));
                }
            });
        return () => controller.abort();
    }, [accessToken, selectedOrgId, selectedTrailId, attendanceReloadToken]);

    const selectedOrgTrails = useMemo(() => trails.filter((trail) => !selectedOrgId || trail.org_id === selectedOrgId), [selectedOrgId, trails]);

    const canInteract = Boolean(accessToken);

    const handleOrgRefresh = useCallback(() => {
        setOrgReloadToken((value) => value + 1);
    }, []);

    const handleSystemRefresh = useCallback(() => {
        setSystemReloadToken((value) => value + 1);
    }, []);

    const handleAttendanceRefresh = useCallback(() => {
        setAttendanceReloadToken((value) => value + 1);
    }, []);

    return (
        <div className="space-y-6">
            <Card className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-2 text-gray-800">
                        <Trophy className="h-5 w-5 text-amber-500" />
                        <h2 className="text-lg font-semibold">System Leaderboard</h2>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleSystemRefresh}
                        disabled={!canInteract || systemState.loading}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </Button>
                </div>
                {!canInteract ? (
                    <p className="text-sm text-gray-600">Sign in to view live rankings.</p>
                ) : systemState.error ? (
                    <p className="text-sm text-rose-600">{systemState.error}</p>
                ) : systemState.loading && systemRows.length === 0 ? (
                    <p className="text-sm text-gray-600">Loading leaderboard…</p>
                ) : systemRows.length === 0 ? (
                    <p className="text-sm text-gray-600">No ranking data available yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="py-2">Rank</th>
                                    <th className="py-2">Participant</th>
                                    <th className="py-2 text-right">Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {systemRows.map((row) => (
                                    <tr key={`${row.user_id}-${row.rank}`} className="hover:bg-gray-50">
                                        <td className="py-2 font-medium text-gray-800">#{row.rank}</td>
                                        <td className="py-2 font-mono text-sm text-gray-700">{formatUserId(row.user_id)}</td>
                                        <td className="py-2 text-right font-semibold text-gray-800">{row.score}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <Card className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-2 text-gray-800">
                        <Users className="h-5 w-5 text-teal-500" />
                        <h2 className="text-lg font-semibold">Organisation Leaderboard</h2>
                    </div>
                    <div className="flex flex-wrap gap-3 items-center">
                        <label className="text-sm text-gray-700 flex items-center gap-2">
                            <span>Organisation</span>
                            <select
                                value={selectedOrgId}
                                onChange={(event) => setSelectedOrgId(event.target.value)}
                                disabled={!canInteract || orgIds.length === 0}
                                className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                            >
                                {orgIds.length === 0 ? (
                                    <option value="">No organisations</option>
                                ) : (
                                    orgIds.map((orgId) => (
                                        <option key={orgId} value={orgId}>
                                            {orgId}
                                        </option>
                                    ))
                                )}
                            </select>
                        </label>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleOrgRefresh}
                            disabled={!canInteract || !selectedOrgId || orgState.loading}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Refresh
                        </Button>
                    </div>
                </div>
                {!canInteract ? (
                    <p className="text-sm text-gray-600">Sign in to view organisation rankings.</p>
                ) : !selectedOrgId ? (
                    <p className="text-sm text-gray-600">Join an organisation to see member standings.</p>
                ) : orgState.error ? (
                    <p className="text-sm text-rose-600">{orgState.error}</p>
                ) : orgState.loading && orgRows.length === 0 ? (
                    <p className="text-sm text-gray-600">Loading organisation leaderboard…</p>
                ) : orgRows.length === 0 ? (
                    <p className="text-sm text-gray-600">No leaderboard entries for this organisation yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="py-2">Rank</th>
                                    <th className="py-2">Participant</th>
                                    <th className="py-2 text-right">Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {orgRows.map((row) => (
                                    <tr key={`${row.user_id}-${row.rank}`} className="hover:bg-gray-50">
                                        <td className="py-2 font-medium text-gray-800">#{row.rank}</td>
                                        <td className="py-2 font-mono text-sm text-gray-700">{formatUserId(row.user_id)}</td>
                                        <td className="py-2 text-right font-semibold text-gray-800">{row.score}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <Card className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-2 text-gray-800">
                        <Clock className="h-5 w-5 text-indigo-500" />
                        <h2 className="text-lg font-semibold">Trail Attendance</h2>
                    </div>
                    <div className="flex flex-wrap gap-3 items-center">
                        <label className="text-sm text-gray-700 flex items-center gap-2">
                            <span>Trail</span>
                            <select
                                value={selectedTrailId}
                                onChange={(event) => setSelectedTrailId(event.target.value)}
                                disabled={!canInteract || selectedOrgTrails.length === 0}
                                className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 min-w-[12rem]"
                            >
                                {selectedOrgTrails.length === 0 ? (
                                    <option value="">No trails available</option>
                                ) : (
                                    selectedOrgTrails.map((trail) => (
                                        <option key={trail.id} value={trail.id}>
                                            {trail.title}
                                        </option>
                                    ))
                                )}
                            </select>
                        </label>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleAttendanceRefresh}
                            disabled={!canInteract || !selectedOrgId || !selectedTrailId || attendanceState.loading}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Refresh
                        </Button>
                    </div>
                </div>
                {!canInteract ? (
                    <p className="text-sm text-gray-600">Sign in to review attendance.</p>
                ) : !selectedOrgId ? (
                    <p className="text-sm text-gray-600">Select an organisation to load attendance.</p>
                ) : !selectedTrailId ? (
                    <p className="text-sm text-gray-600">Create a trail to start tracking attendance.</p>
                ) : attendanceState.error ? (
                    <p className="text-sm text-rose-600">{attendanceState.error}</p>
                ) : attendanceState.loading && attendanceRows.length === 0 ? (
                    <p className="text-sm text-gray-600">Loading attendance…</p>
                ) : attendanceRows.length === 0 ? (
                    <p className="text-sm text-gray-600">No check-ins recorded for this trail yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="py-2">Participant</th>
                                    <th className="py-2">Checked At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {attendanceRows.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50">
                                        <td className="py-2 font-mono text-sm text-gray-700">{formatUserId(row.user_id)}</td>
                                        <td className="py-2 text-gray-800">{formatDateTime(row.checked_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
