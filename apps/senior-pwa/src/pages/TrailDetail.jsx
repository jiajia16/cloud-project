import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
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

function formatDate(value) {
    if (!value) {
        return "Date TBC";
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

const STATUS_LABELS = {
    pending: "Pending approval",
    approved: "Approved",
    confirmed: "Confirmed",
    rejected: "Rejected",
    cancelled: "Cancelled",
    waitlisted: "Waitlisted",
};

const STATUS_DESCRIPTIONS = {
    pending: "Your spot is awaiting organiser approval.",
    approved: "Approved - organiser still needs to confirm your slot.",
    confirmed: "You are confirmed. Remember to attend on time.",
    rejected: "Unfortunately this registration was rejected.",
    cancelled: "You have cancelled this registration.",
    waitlisted: "Currently waitlisted - you will be moved up when slots free up.",
};

const INACTIVE_REGISTRATION_STATUSES = new Set(["cancelled", "rejected"]);

export default function TrailDetail() {
    const navigate = useNavigate();
    const location = useLocation();
    const { trailId } = useParams();
    const { tokens, user } = useAuth();
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
                    setError(err?.message ?? "Unable to load trail information.");
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
            setError(err?.message ?? "Unable to join this trail. Please try again.");
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
            setError(err?.message ?? "Unable to cancel this registration. Please try again.");
        } finally {
            setActionLoading(false);
        }
    }, [accessToken, registration?.id, refresh]);

    return (
        <Layout title="Trail Details">
            <div className="space-y-6 max-w-3xl mx-auto">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm text-cyan-700 hover:text-cyan-900"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Trails
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
                    <Card className="p-6 text-sm text-gray-600">Loading trail details...</Card>
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
                                <span>
                                    {formatDate(trail.starts_at)}{" \u2192 "}{formatDate(trail.ends_at)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-teal-600" />
                                <span>{trail.location ?? "To be confirmed"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-teal-600" />
                                <span>Capacity: {trail.capacity}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-teal-600" />
                                <span>Status: {trail.status}</span>
                            </div>
                        </div>

                        {registration ? (
                            <div className="space-y-3">
                                <Card className="bg-cyan-50 border border-cyan-100">
                                    <p className="font-semibold text-cyan-800 text-sm">
                                        Registration status:
                                    </p>
                                    <p className="text-lg font-bold text-cyan-700">
                                        {STATUS_LABELS[registration.status] ?? registration.status}
                                    </p>
                                    <p className="text-sm text-cyan-700/80">
                                        {STATUS_DESCRIPTIONS[registration.status] ??
                                            "We will notify you when there is an update."}
                                    </p>
                                    {registration.note && (
                                        <p className="mt-2 text-xs text-cyan-800/80">
                                            Your note: {registration.note}
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
                                            {actionLoading ? "Cancelling..." : "Cancel registration"}
                                        </Button>
                                    )}
                                    {!canCancel && (
                                        <p className="text-xs text-gray-500">
                                            This registration can no longer be cancelled.
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-sm text-gray-700">
                                    You have not joined this trail yet. Secure your spot now.
                                </p>
                                <Button
                                    onClick={handleJoin}
                                    className="bg-teal-500 hover:bg-teal-600 text-white"
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? "Joining..." : "Join this trail"}
                                </Button>
                            </div>
                        )}
                    </Card>
                )}
            </div>
        </Layout>
    );
}
