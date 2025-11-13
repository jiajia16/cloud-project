import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { Card, Button, SectionTitle } from "@silvertrails/ui";
import { formatPoints } from "@silvertrails/utils";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
    getMyBalance,
    getMyLedger,
    listOrgVouchers,
    redeemVoucher,
    getMyRedemptions,
} from "../services/points.js";
import { getTrail, getMyTrailActivities } from "../services/trails.js";

function formatDate(value) {
    if (!value) {
        return "Pending";
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

export default function Rewards() {
    const { tokens, user } = useAuth();
    const accessToken = tokens?.access_token;
    const orgIds = user?.org_ids ?? [];
    const pendingOrgAssignment = !orgIds || orgIds.length === 0;
    const navigate = useNavigate();

    const [selectedOrgId, setSelectedOrgId] = useState(() => orgIds[0] ?? null);
    const [balance, setBalance] = useState(null);
    const [ledger, setLedger] = useState([]);
    const [vouchers, setVouchers] = useState([]);
    const [redemptions, setRedemptions] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [redeemingId, setRedeemingId] = useState(null);
    const [redeemError, setRedeemError] = useState("");
    const [redeemSuccess, setRedeemSuccess] = useState(null);
    const [trailMetadata, setTrailMetadata] = useState({});

    useEffect(() => {
        if (!selectedOrgId && orgIds.length > 0) {
            setSelectedOrgId(orgIds[0]);
        }
    }, [orgIds, selectedOrgId]);

    useEffect(() => {
        setTrailMetadata({});
    }, [selectedOrgId]);

    const refreshData = useCallback(
        async ({ signal } = {}) => {
            if (!accessToken || !selectedOrgId) {
                return;
            }
            setLoading(true);
            setError("");
            try {
                const [balanceRes, ledgerRes, vouchersRes, redemptionsRes] = await Promise.all([
                    getMyBalance({ accessToken, orgId: selectedOrgId, signal }),
                    getMyLedger({ accessToken, orgId: selectedOrgId, signal }),
                    listOrgVouchers({ accessToken, orgId: selectedOrgId, signal }),
                    getMyRedemptions({ accessToken, signal }),
                ]);
                if (signal?.aborted) {
                    return;
                }
                setBalance(balanceRes);
                setLedger(Array.isArray(ledgerRes) ? ledgerRes : []);
                setVouchers(Array.isArray(vouchersRes) ? vouchersRes : []);
                setRedemptions(Array.isArray(redemptionsRes) ? redemptionsRes : []);
            } catch (err) {
                if (!(signal?.aborted)) {
                    setError(err?.message ?? "Unable to load your rewards at the moment.");
                }
            } finally {
                if (!(signal?.aborted)) {
                    setLoading(false);
                }
            }
        },
        [accessToken, selectedOrgId]
    );

    useEffect(() => {
        if (!accessToken || !selectedOrgId) {
            return;
        }
        const controller = new AbortController();
        refreshData({ signal: controller.signal });
        return () => controller.abort();
    }, [accessToken, selectedOrgId, refreshData]);

    const currentPoints = balance?.balance ?? 0;

    const handleRedeem = useCallback(
        async (voucher) => {
            if (!accessToken) {
                return;
            }
            if (!selectedOrgId) {
                setRedeemError("Join an organisation to redeem rewards.");
                return;
            }
            setRedeemingId(voucher.id);
            setRedeemError("");
            setRedeemSuccess(null);
            try {
                const redemption = await redeemVoucher({ accessToken, voucherId: voucher.id });
                setRedeemSuccess({
                    name: voucher.name,
                    code: redemption?.voucher_code ?? voucher.code,
                    redeemed_at: redemption?.redeemed_at ?? null,
                });
                await refreshData();
            } catch (err) {
                setRedeemError(err?.message ?? "Unable to redeem this reward right now.");
            } finally {
                setRedeemingId(null);
            }
        },
        [accessToken, refreshData, selectedOrgId]
    );

    const sortedVouchers = useMemo(
        () =>
            [...vouchers].sort((a, b) => {
                if (a.status === b.status) {
                    return a.points_cost - b.points_cost;
                }
                return a.status === "active" ? -1 : 1;
            }),
        [vouchers]
    );

    const sortedLedger = useMemo(
        () => [...ledger].sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at)),
        [ledger]
    );

    useEffect(() => {
        if (!accessToken) {
            return;
        }
        const uniqueTrailIds = Array.from(
            new Set(
                ledger
                    .map((entry) => entry.trail_id)
                    .filter((trailId) => trailId && !trailMetadata[trailId])
            )
        );
        if (uniqueTrailIds.length === 0) {
            return;
        }
        let cancelled = false;
        const controller = new AbortController();
        (async () => {
            const results = await Promise.all(
                uniqueTrailIds.map(async (trailId) => {
                    let trail = null;
                    let activities = [];
                    try {
                        trail = await getTrail({
                            accessToken,
                            trailId,
                            signal: controller.signal,
                        });
                    } catch (err) {
                        // ignore fetching errors so we can still mark this trail as processed
                    }
                    if (trail) {
                        try {
                            activities = await getMyTrailActivities({
                                accessToken,
                                trailId,
                                signal: controller.signal,
                            });
                        } catch (err) {
                            activities = [];
                        }
                    }
                    return { trailId, trail, activities };
                })
            );
            if (cancelled) {
                return;
            }
            setTrailMetadata((prev) => {
                const next = { ...prev };
                results.forEach(({ trailId, trail, activities }) => {
                    const activitiesById = {};
                    const activitiesByOrder = {};
                    activities.forEach((activity) => {
                        activitiesById[activity.id] = activity;
                        if (typeof activity.order === "number") {
                            activitiesByOrder[activity.order] = activity;
                        }
                    });
                    next[trailId] = {
                        title: trail?.title ?? null,
                        activitiesById,
                        activitiesByOrder,
                    };
                });
                return next;
            });
        })();
        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [accessToken, ledger, trailMetadata]);

    const enrichedLedger = useMemo(() => {
        function parseLedgerDetails(details) {
            if (!details || typeof details !== "string") {
                return { fields: {}, notes: [] };
            }
            const fields = {};
            const notes = [];
            details.split(";").forEach((rawPart) => {
                const part = rawPart.trim();
                if (!part) {
                    return;
                }
                const separatorIndex = part.indexOf("=");
                if (separatorIndex === -1) {
                    notes.push(part);
                    return;
                }
                const key = part.slice(0, separatorIndex).trim();
                const value = part.slice(separatorIndex + 1).trim();
                if (!key) {
                    notes.push(part);
                    return;
                }
                fields[key] = value;
            });
            return { fields, notes };
        }

        function formatTitleCase(value) {
            const spaced = value.replaceAll("_", " ");
            return spaced
                .split(" ")
                .map((word) => (word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : ""))
                .join(" ");
        }

        const REASON_LABELS = {
            activity_checkin: "Activity Check-In",
            checkin: "Trail Check-In",
            manual_bonus: "Manual Bonus",
            voucher_redeem: "Voucher Redemption",
        };

        function formatReasonBase(reasonKey) {
            if (!reasonKey) {
                return "";
            }
            const normalizedKey = reasonKey.toLowerCase();
            if (REASON_LABELS[normalizedKey]) {
                return REASON_LABELS[normalizedKey];
            }
            return formatTitleCase(reasonKey.replaceAll("_", " "));
        }

        function formatReasonLabel(reasonKey, noteLabels) {
            if (!reasonKey && noteLabels.length === 0) {
                return "";
            }
            const base = formatReasonBase(reasonKey);
            if (noteLabels.length === 0) {
                return base;
            }
            const notesText = noteLabels.join(", ");
            return base ? `${base} (${notesText})` : `(${notesText})`;
        }

        function formatNoteLabel(note) {
            const normalized = note.trim().toLowerCase();
            if (!normalized) {
                return null;
            }
            if (normalized === "qr-checkin" || normalized === "qr-checkin-nats") {
                return "QR";
            }
            return formatTitleCase(note.replaceAll("-", " "));
        }

        return sortedLedger.slice(0, 10).map((entry) => {
            const rawReason = entry.reason || "";
            const metadata = entry.trail_id ? trailMetadata[entry.trail_id] : null;
            const parsed = parseLedgerDetails(entry.details);
            const activityId = parsed.fields.activity;
            const activityOrder = parsed.fields.order ? Number(parsed.fields.order) : null;
            let activityTitle = null;
            if (activityId && metadata?.activitiesById?.[activityId]) {
                activityTitle = metadata.activitiesById[activityId]?.title ?? null;
            } else if (
                activityOrder &&
                metadata?.activitiesByOrder?.[activityOrder]
            ) {
                activityTitle = metadata.activitiesByOrder[activityOrder]?.title ?? null;
            }
            const trailTitle = metadata?.title ?? null;
            const primaryParts = [];
            if (trailTitle) {
                primaryParts.push(trailTitle);
            }
            if (activityTitle) {
                primaryParts.push(activityTitle);
            }
            const reasonLabel = formatReasonBase(rawReason);
            const displayLabel = primaryParts.length > 0 ? primaryParts.join(" • ") : reasonLabel;
            const formattedNotes = parsed.notes
                .map((note) => formatNoteLabel(note))
                .filter(Boolean);
            const contextLabel = formatReasonLabel(rawReason, formattedNotes);
            return {
                ...entry,
                displayLabel,
                displayContext: contextLabel,
            };
        });
    }, [sortedLedger, trailMetadata]);

    const sortedRedemptions = useMemo(
        () =>
            [...redemptions].sort((a, b) => new Date(b.redeemed_at) - new Date(a.redeemed_at)),
        [redemptions]
    );

    const canRedeem = (voucher) =>
        voucher.status === "active" &&
        (voucher.total_quantity === null || voucher.redeemed_count < voucher.total_quantity) &&
        (voucher.points_cost === 0 || currentPoints >= voucher.points_cost);

    return (
        <Layout title="Rewards">
            <div className="space-y-6">
                <Card className="p-5 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm text-gray-600">Available points</p>
                            <p className="text-4xl font-extrabold text-teal-600">
                                {formatPoints(currentPoints)}
                            </p>
                        </div>
                        {orgIds.length > 1 && (
                            <div className="text-right">
                                <label className="block text-xs text-gray-500 uppercase mb-1">
                                    Organisation
                                </label>
                                <select
                                    value={selectedOrgId ?? ""}
                                    onChange={(event) => setSelectedOrgId(event.target.value || null)}
                                    className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                                >
                                    {orgIds.map((orgId) => (
                                        <option key={orgId} value={orgId}>
                                            {orgId.slice(0, 8).toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                    {balance?.updated_at && (
                        <p className="text-xs text-gray-500">
                            Last updated {formatDate(balance.updated_at)}
                        </p>
                    )}
                    {error && (
                        <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                            {error}
                        </p>
                    )}
                    {(!orgIds || orgIds.length === 0) && (
                        <p className="text-sm text-gray-600">
                            You have not been added to an organisation yet. Ask your organiser for an invite or use the Join page to enter a code so you can start collecting rewards.
                        </p>
                    )}
                </Card>

                {pendingOrgAssignment ? (
                    <Card className="p-5 space-y-3 border border-amber-200 bg-amber-50 text-amber-900">
                        <h3 className="text-lg font-semibold">Complete onboarding to unlock rewards</h3>
                        <p className="text-sm leading-6">
                            Rewards, vouchers, and point balances become available once your organiser assigns you to an organisation. Use the invite code they share with you or ask them to add you from the organiser dashboard.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                                onClick={() => navigate("/join")}
                            >
                                Enter invite code
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 border-amber-200 text-amber-900 hover:bg-white"
                                onClick={() => navigate("/home")}
                            >
                                Back to Home
                            </Button>
                        </div>
                    </Card>
                ) : selectedOrgId && (
                    <>
                        <SectionTitle title="Redeemable Rewards" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {loading && vouchers.length === 0 ? (
                                <Card className="p-4 text-sm text-gray-600">Loading rewards…</Card>
                            ) : sortedVouchers.length === 0 ? (
                                <Card className="p-4 text-sm text-gray-600">
                                    No rewards available right now. Check back later!
                                </Card>
                            ) : (
                                sortedVouchers.map((voucher) => {
                                    const exhausted =
                                        voucher.total_quantity !== null &&
                                        voucher.redeemed_count >= voucher.total_quantity;
                                    const disabled = !canRedeem(voucher) || !!redeemingId;
                                    const statusLabel = exhausted
                                        ? "Out of stock"
                                        : voucher.status === "active"
                                            ? "Available"
                                            : voucher.status.replace("_", " ");
                                    return (
                                        <Card key={voucher.id} className="p-4 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold text-lg">{voucher.name}</p>
                                                    <p className="text-sm text-gray-500">
                                                        Cost: {formatPoints(voucher.points_cost)}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`text-xs px-2 py-1 rounded-full ${
                                                        exhausted || voucher.status !== "active"
                                                            ? "bg-gray-200 text-gray-600"
                                                            : "bg-teal-100 text-teal-700"
                                                    }`}
                                                >
                                                    {statusLabel}
                                                </span>
                                            </div>
                                            <Button
                                                className="w-full"
                                                onClick={() => handleRedeem(voucher)}
                                                disabled={disabled}
                                            >
                                                {redeemingId === voucher.id ? "Redeeming…" : "Redeem"}
                                            </Button>
                                            {voucher.total_quantity !== null && (
                                                <p className="text-xs text-gray-500 text-right">
                                                    {voucher.redeemed_count}/{voucher.total_quantity} claimed
                                                </p>
                                            )}
                                        </Card>
                                    );
                                })
                            )}
                        </div>
                        {redeemError && (
                            <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                                {redeemError}
                            </p>
                        )}
                        {redeemSuccess && (
                            <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                                <p className="font-semibold">
                                    {redeemSuccess.name || "Voucher"} redeemed successfully!
                                </p>
                                <p className="mt-1">
                                    Present this code to the organiser:
                                    <span className="ml-2 font-mono font-semibold text-lg text-emerald-800">
                                        {redeemSuccess.code?.toUpperCase()}
                                    </span>
                                </p>
                                {redeemSuccess.redeemed_at && (
                                    <p className="text-xs text-emerald-600 mt-1">
                                        Redeemed at {formatDate(redeemSuccess.redeemed_at)}
                                    </p>
                                )}
                            </div>
                        )}

                        <SectionTitle title="Points History" />
                        <Card>
                            {loading && ledger.length === 0 ? (
                                <p className="text-sm text-gray-600">Loading your points history…</p>
                            ) : sortedLedger.length === 0 ? (
                                <p className="text-sm text-gray-600">No point activity recorded for this organisation yet.</p>
                            ) : (
                                <ul className="divide-y">
                                    {enrichedLedger.map((entry) => (
                                        <li key={entry.id} className="py-3 flex justify-between text-sm">
                                            <div>
                                                <p className="font-medium text-gray-800">
                                                    {entry.displayLabel}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {entry.displayContext
                                                        ? `${entry.displayContext} - ${formatDate(entry.occurred_at)}`
                                                        : formatDate(entry.occurred_at)}
                                                </p>
                                            </div>
                                            <span
                                                className={`font-semibold ${
                                                    entry.delta >= 0 ? "text-teal-600" : "text-rose-500"
                                                }`}
                                            >
                                                {entry.delta >= 0 ? "+" : ""}
                                                {formatPoints(entry.delta)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Card>

                        <SectionTitle title="Redemption History" />
                        <Card>
                            {loading && redemptions.length === 0 ? (
                                <p className="text-sm text-gray-600">Loading your redemptions…</p>
                            ) : sortedRedemptions.length === 0 ? (
                                <p className="text-sm text-gray-600">You haven’t redeemed any rewards yet.</p>
                            ) : (
                                <div className="-mx-5 max-h-64 overflow-y-auto">
                                    <ul className="divide-y">
                                        {sortedRedemptions.slice(0, 5).map((entry) => (
                                            <li key={entry.id} className="py-3 px-5">
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-medium text-gray-800">
                                                        {entry.voucher_name
                                                            ? entry.voucher_name
                                                            : entry.voucher_code
                                                                ? `Voucher ${entry.voucher_code.toUpperCase()}`
                                                                : `Voucher ${entry.voucher_id.slice(0, 8).toUpperCase()}`}
                                                    </span>
                                                    <span className="text-xs uppercase text-gray-500">
                                                        {entry.status.replaceAll("_", " ")}
                                                    </span>
                                                </div>
                                                {entry.points_cost != null && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Points used: {formatPoints(entry.points_cost)}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {formatDate(entry.redeemed_at)}
                                                </p>
                                                {entry.voucher_code && (
                                                    <p className="text-xs text-gray-600 mt-1 font-mono">
                                                        Code: {entry.voucher_code.toUpperCase()}
                                                    </p>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </Card>
                    </>
                )}
            </div>
        </Layout>
    );
}
