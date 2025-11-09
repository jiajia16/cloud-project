import React, { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout.jsx";
import { useNavigate } from "react-router-dom";
import { Camera, CalendarRange, MapPin, RefreshCcw, XCircle } from "lucide-react";
import { Card, Button, SectionTitle } from "@silvertrails/ui";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
    getMyConfirmedTrails,
    getMyRegistrations,
    listTrails,
    registerForTrail,
} from "../services/trails.js";
import { getMyAttendance } from "../services/leaderboard.js";

const STATUS_LABELS = {
    pending: "Pending approval",
    approved: "Approved",
    confirmed: "Confirmed",
    rejected: "Rejected",
    cancelled: "Cancelled",
    waitlisted: "Waitlisted",
};

const ACTIVE_REGISTRATION_STATUSES = new Set(["pending", "approved", "confirmed", "waitlisted"]);

function formatDateTime(value) {
    if (!value) {
        return "TBC";
    }
    try {
        return new Intl.DateTimeFormat("en-SG", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(value));
    } catch (err) {
        return value;
    }
}

export default function MyTrails() {
    const navigate = useNavigate();
    const { tokens } = useAuth();
    const accessToken = tokens?.access_token;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [trails, setTrails] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [confirmedTrails, setConfirmedTrails] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [registeringTrailId, setRegisteringTrailId] = useState(null);

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
                    setError(err?.message ?? "Failed to load your trails.");
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
                setError(err?.message ?? "Unable to join trail. Please try again.");
            } finally {
                setRegisteringTrailId(null);
            }
        },
        [accessToken, fetchAll]
    );

    return (
        <Layout title="My Trails">
            <div className="space-y-6">
                <Card className="bg-gradient-to-r from-teal-400 to-cyan-400 text-white p-5">
                    <h2 className="text-2xl font-bold mb-1">My Trails</h2>
                    <p className="opacity-90">Track your upcoming activities and view your progress.</p>
                    <div className="mt-4 bg-white/15 rounded-full h-3 overflow-hidden">
                        <div
                            className="h-full bg-white/80 transition-all"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                    <p className="mt-2 text-sm">
                        {confirmedCount} of {totalRegistrations || 1} activities confirmed ({progressPct}%)
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
                    <Button
                        onClick={() => fetchAll()}
                        className="flex items-center gap-2 border border-teal-300 text-teal-700 bg-white hover:bg-teal-50"
                        disabled={loading}
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Refresh
                    </Button>
                    <Button
                        onClick={() => navigate("/scan")}
                        className="flex items-center gap-2 bg-gradient-to-r from-teal-400 to-cyan-400 text-white"
                    >
                        <Camera className="w-5 h-5" />
                        Scan QR to Mark Activity Done
                    </Button>
                </div>

                <SectionTitle title="Registered Activities" />
                {loading && enrichedRegistrations.length === 0 ? (
                    <Card className="p-4 text-sm text-gray-600">Loading your activities...</Card>
                ) : enrichedRegistrations.length === 0 ? (
                    <Card className="p-4 text-sm text-gray-600">
                        You have not joined any trails yet. Explore the available activities below!
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {enrichedRegistrations.map((reg) => (
                            <Card key={reg.id} className="p-4 space-y-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-lg">
                                            {reg.trail?.title ?? "Trail"}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {reg.trail?.description ?? "Stay tuned for more details."}
                                        </p>
                                    </div>
                                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-teal-100 text-teal-700 uppercase tracking-wide">
                                        {STATUS_LABELS[reg.status] ?? reg.status}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-3 text-sm text-gray-700">
                                    <span className="flex items-center gap-1">
                                        <CalendarRange className="w-4 h-4 text-teal-500" />
                                        {formatDateTime(reg.trail?.starts_at)}{" \u2192 "}{formatDateTime(reg.trail?.ends_at)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4 text-teal-500" />
                                        {reg.trail?.location ?? "To be confirmed"}
                                    </span>
                                </div>
                                {reg.note && (
                                    <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                                        Your note: {reg.note}
                                    </p>
                                )}
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button
                                        onClick={() =>
                                            openTrailDetail(
                                                reg.trail ?? { id: reg.trail_id, title: "Trail" },
                                                reg
                                            )
                                        }
                                        className="bg-white border border-teal-200 text-teal-700 hover:bg-teal-50 text-sm"
                                    >
                                        View details
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                <SectionTitle title="Attendance History" />
                <Card>
                    {loading && attendance.length === 0 ? (
                        <p className="text-sm text-gray-600">Loading your attendance…</p>
                    ) : attendanceHistory.length === 0 ? (
                        <p className="text-sm text-gray-600">
                            No organiser-confirmed attendance recorded yet. Scan a QR code and check back!
                        </p>
                    ) : (
                        <ul className="divide-y">
                            {attendanceHistory.slice(0, 10).map((entry) => {
                                const trail = trailsById.get(entry.trail_id);
                                return (
                                    <li key={entry.id} className="py-3 text-sm flex justify-between gap-3">
                                        <div>
                                            <p className="font-medium text-gray-800">
                                                {trail?.title ?? `Trail ${entry.trail_id.slice(0, 8).toUpperCase()}`}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatDateTime(entry.checked_at)}
                                            </p>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            Org {entry.org_id.slice(0, 8).toUpperCase()}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </Card>

                <SectionTitle title="Available Trails to Join" />
                {loading && trails.length === 0 ? (
                    <Card className="p-4 text-sm text-gray-600">Loading available trails...</Card>
                ) : availableTrails.length === 0 ? (
                    <Card className="p-4 text-sm text-gray-600">
                        No new trails at the moment - check back soon!
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availableTrails.map((trail) => (
                            <Card key={trail.id} className="p-4 space-y-3">
                                <div>
                                    <h3 className="font-semibold text-lg">{trail.title}</h3>
                                    <p className="text-sm text-gray-600">
                                        {trail.description ?? "Discover a new activity with friends."}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-3 text-sm text-gray-700">
                                    <span className="flex items-center gap-1">
                                        <CalendarRange className="w-4 h-4 text-teal-500" />
                                        {formatDateTime(trail.starts_at)}{" \u2192 "}{formatDateTime(trail.ends_at)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4 text-teal-500" />
                                        {trail.location ?? "To be confirmed"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">
                                        Capacity: {trail.capacity} | Status: {" "}
                                        <span className="capitalize">{trail.status}</span>
                                    </span>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => openTrailDetail(trail)}
                                            className="bg-white border border-teal-200 text-teal-700 hover:bg-teal-50 text-sm"
                                        >
                                            Details
                                        </Button>
                                        <Button
                                            onClick={() => handleRegister(trail.id)}
                                            disabled={registeringTrailId === trail.id}
                                            className="bg-teal-500 hover:bg-teal-600 text-white text-sm"
                                        >
                                            {registeringTrailId === trail.id ? "Joining..." : "Join Trail"}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {confirmedTrails.length > 0 && (
                    <>
                        <SectionTitle title="Confirmed Trails" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {confirmedTrails.map((trail) => (
                                <Card key={trail.id} className="p-4 space-y-2">
                                    <h3 className="font-semibold text-lg">{trail.title}</h3>
                                    <p className="text-sm text-gray-600">{trail.description}</p>
                                    <div className="flex flex-wrap gap-3 text-sm text-gray-700">
                                        <span className="flex items-center gap-1">
                                            <CalendarRange className="w-4 h-4 text-teal-500" />
                                            {formatDateTime(trail.starts_at)}{" \u2192 "}{formatDateTime(trail.ends_at)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4 text-teal-500" />
                                            {trail.location ?? "To be confirmed"}
                                        </span>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            onClick={() => openTrailDetail(trail)}
                                            className="bg-white border border-teal-200 text-teal-700 hover:bg-teal-50 text-sm"
                                        >
                                            View details
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
