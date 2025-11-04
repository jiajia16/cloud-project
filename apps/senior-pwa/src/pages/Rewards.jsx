import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
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

    const [selectedOrgId, setSelectedOrgId] = useState(() => orgIds[0] ?? null);
    const [balance, setBalance] = useState(null);
    const [ledger, setLedger] = useState([]);
    const [vouchers, setVouchers] = useState([]);
    const [redemptions, setRedemptions] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [redeemingId, setRedeemingId] = useState(null);
    const [redeemError, setRedeemError] = useState("");

    useEffect(() => {
        if (!selectedOrgId && orgIds.length > 0) {
            setSelectedOrgId(orgIds[0]);
        }
    }, [orgIds, selectedOrgId]);

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
            setRedeemingId(voucher.id);
            setRedeemError("");
            try {
                await redeemVoucher({ accessToken, voucherId: voucher.id });
                await refreshData();
            } catch (err) {
                setRedeemError(err?.message ?? "Unable to redeem this reward right now.");
            } finally {
                setRedeemingId(null);
            }
        },
        [accessToken, refreshData]
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

    const sortedRedemptions = useMemo(
        () =>
            [...redemptions].sort((a, b) => new Date(b.redeemed_at) - new Date(a.redeemed_at)),
        [redemptions]
    );

    const canRedeem = (voucher) =>
        voucher.status === "active" &&
        (voucher.total_quantity === null || voucher.redeemed_count < voucher.total_quantity) &&
        currentPoints >= voucher.points_cost;

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
                            You have not been added to an organisation yet. Ask your organiser to invite you so you can start collecting rewards.
                        </p>
                    )}
                </Card>

                {selectedOrgId && (
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

                        <SectionTitle title="Points History" />
                        <Card>
                            {loading && ledger.length === 0 ? (
                                <p className="text-sm text-gray-600">Loading your points history…</p>
                            ) : sortedLedger.length === 0 ? (
                                <p className="text-sm text-gray-600">No point activity recorded for this organisation yet.</p>
                            ) : (
                                <ul className="divide-y">
                                    {sortedLedger.slice(0, 10).map((entry) => (
                                        <li key={entry.id} className="py-3 flex justify-between text-sm">
                                            <div>
                                                <p className="font-medium text-gray-800 capitalize">
                                                    {entry.reason.replaceAll("_", " ")}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatDate(entry.occurred_at)}
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
                                <ul className="divide-y">
                                    {sortedRedemptions.slice(0, 10).map((entry) => (
                                        <li key={entry.id} className="py-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium text-gray-800">
                                                    Voucher {entry.voucher_id.slice(0, 8).toUpperCase()}
                                                </span>
                                                <span className="text-xs uppercase text-gray-500">
                                                    {entry.status.replaceAll("_", " ")}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatDate(entry.redeemed_at)}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Card>
                    </>
                )}
            </div>
        </Layout>
    );
}

