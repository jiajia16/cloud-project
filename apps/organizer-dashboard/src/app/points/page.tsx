"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Card } from "@silvertrails/ui";
import { formatPoints } from "@silvertrails/utils";
import {
    Coins,
    Gift,
    RefreshCw,
    Loader2,
    Plus,
    Edit3,
    X,
    History,
    Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { listParticipants, type UserSummary } from "../../services/auth";
import {
    adjustPoints,
    createVoucher,
    getMyPointsBalance,
    listOrgBalances,
    listOrgLedger,
    listVouchers,
    updateVoucher,
    type OrgBalance,
    type OrgLedgerEntry,
    type PointsBalance,
    type Voucher,
    type VoucherCreatePayload,
    type VoucherUpdatePayload,
} from "../../services/points";
type AlertState = { type: "success" | "error"; message: string } | null;
type VoucherEditorState = {
    mode: "create" | "edit";
    open: boolean;
    voucher: Voucher | null;
};

type AdjustInput = {
    identifier: string;
    delta: number;
    reason?: string;
};

type RefreshOptions = {
    signal?: AbortSignal;
    silently?: boolean;
};

function formatDateTime(value: string | null | undefined) {
    if (!value) {
        return "—";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return new Intl.DateTimeFormat("en-SG", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

function formatDelta(delta: number) {
    if (!Number.isFinite(delta)) {
        return "0 pts";
    }
    const sign = delta > 0 ? "+" : "";
    return `${sign}${delta} pts`;
}

function getErrorMessage(error: unknown) {
    if (error instanceof Error && error.message) {
        return error.message;
    }
    return "Unable to complete the request.";
}

type VoucherFormProps = {
    mode: "create" | "edit";
    submitting: boolean;
    initial?: Voucher | null;
    onSubmit: (payload: VoucherCreatePayload | VoucherUpdatePayload) => Promise<void>;
    onCancel: () => void;
};

function VoucherForm({ mode, submitting, initial, onSubmit, onCancel }: VoucherFormProps) {
    const [code, setCode] = useState(() => initial?.code ?? "");
    const [name, setName] = useState(() => initial?.name ?? "");
    const [pointsCost, setPointsCost] = useState(() =>
        initial?.points_cost !== undefined ? String(initial.points_cost) : ""
    );
    const [totalQuantity, setTotalQuantity] = useState(() =>
        initial?.total_quantity !== null && initial?.total_quantity !== undefined
            ? String(initial.total_quantity)
            : ""
    );
    const [status, setStatus] = useState<Voucher["status"]>(initial?.status ?? "active");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (mode === "create") {
            setCode("");
            setStatus("active");
        } else if (initial) {
            setCode(initial.code);
            setStatus(initial.status);
        }
        setName(initial?.name ?? "");
        setPointsCost(initial?.points_cost !== undefined ? String(initial.points_cost) : "");
        setTotalQuantity(
            initial?.total_quantity !== null && initial?.total_quantity !== undefined
                ? String(initial.total_quantity)
                : ""
        );
        setError(null);
    }, [initial, mode]);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError(null);

        const trimmedName = name.trim();
        const trimmedCode = code.trim();
        const pointsValue = Number(pointsCost);
        const quantityValue = totalQuantity.trim() ? Number(totalQuantity) : null;

        if (mode === "create" && !trimmedCode) {
            setError("Voucher code is required.");
            return;
        }
        if (!trimmedName) {
            setError("Voucher name is required.");
            return;
        }
        if (!Number.isFinite(pointsValue) || pointsValue <= 0) {
            setError("Points cost must be a positive number.");
            return;
        }
        if (quantityValue !== null && (!Number.isInteger(quantityValue) || quantityValue < 0)) {
            setError("Total quantity must be a whole number or left blank.");
            return;
        }

        try {
            if (mode === "create") {
                await onSubmit({
                    code: trimmedCode,
                    name: trimmedName,
                    points_cost: pointsValue,
                    total_quantity: quantityValue,
                } satisfies VoucherCreatePayload);
            } else {
                const payload: VoucherUpdatePayload = {
                    name: trimmedName,
                    points_cost: pointsValue,
                    total_quantity: quantityValue,
                    status,
                };
                await onSubmit(payload);
            }
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "create" ? (
                <p className="text-sm text-gray-600">
                    Create a new reward voucher for participants. Codes must be unique within the
                    organisation.
                </p>
            ) : (
                <p className="text-sm text-gray-600">
                    Update voucher details or toggle availability. The voucher code cannot be changed.
                </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="text-sm font-medium text-gray-700">
                    Voucher Code
                    <input
                        type="text"
                        value={code}
                        onChange={(event) => setCode(event.target.value.toUpperCase())}
                        className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                        disabled={mode === "edit"}
                        placeholder="E.g. WELCOME10"
                        required
                    />
                </label>
                <label className="text-sm font-medium text-gray-700">
                    Voucher Name
                    <input
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                        placeholder="E.g. Free Coffee"
                        required
                    />
                </label>
                <label className="text-sm font-medium text-gray-700">
                    Points Cost
                    <input
                        type="number"
                        min={1}
                        value={pointsCost}
                        onChange={(event) => setPointsCost(event.target.value)}
                        className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                        placeholder="100"
                        required
                    />
                </label>
                <label className="text-sm font-medium text-gray-700">
                    Total Quantity (optional)
                    <input
                        type="number"
                        min={0}
                        value={totalQuantity}
                        onChange={(event) => setTotalQuantity(event.target.value)}
                        className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                        placeholder="Leave blank for unlimited"
                    />
                </label>
                {mode === "edit" && (
                    <label className="text-sm font-medium text-gray-700">
                        Status
                        <select
                            value={status}
                            onChange={(event) => setStatus(event.target.value as Voucher["status"])}
                            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                        >
                            <option value="active">Active</option>
                            <option value="disabled">Disabled</option>
                        </select>
                    </label>
                )}
            </div>
            {error && (
                <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                    {error}
                </div>
            )}
            <div className="flex flex-wrap justify-end gap-3">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
                    Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                    {submitting ? "Saving…" : mode === "create" ? "Create Voucher" : "Save Changes"}
                </Button>
            </div>
        </form>
    );
}

type AdjustPointsFormProps = {
    submitting: boolean;
    onSubmit: (input: AdjustInput) => Promise<void>;
};

function AdjustPointsForm({ submitting, onSubmit }: AdjustPointsFormProps) {
    const [memberId, setMemberId] = useState("");
    const [points, setPoints] = useState("");
    const [mode, setMode] = useState<"credit" | "debit">("credit");
    const [reason, setReason] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError(null);

        const trimmedId = memberId.trim();
        const pointsValue = Number(points);
        const trimmedReason = reason.trim();

        if (!trimmedId) {
            setError("Member identifier is required.");
            return;
        }
        if (!Number.isFinite(pointsValue) || pointsValue <= 0) {
            setError("Points must be a positive number.");
            return;
        }

        const delta = mode === "credit" ? pointsValue : -pointsValue;

        try {
            await onSubmit({
                identifier: trimmedId,
                delta,
                reason: trimmedReason ? trimmedReason : undefined,
            });
            setMemberId("");
            setPoints("");
            setReason("");
            setMode("credit");
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-600">
                Adjust an individual senior's balance. Debits subtract points while credits add them.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="text-sm font-medium text-gray-700">
                    Member Identifier
                    <input
                        type="text"
                        value={memberId}
                        onChange={(event) => setMemberId(event.target.value)}
                        className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                        placeholder="NRIC or User ID"
                        required
                    />
                </label>
                <label className="text-sm font-medium text-gray-700">
                    Points
                    <input
                        type="number"
                        min={1}
                        value={points}
                        onChange={(event) => setPoints(event.target.value)}
                        className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                        placeholder="100"
                        required
                    />
                </label>
                <label className="text-sm font-medium text-gray-700">
                    Adjustment
                    <select
                        value={mode}
                        onChange={(event) => setMode(event.target.value as "credit" | "debit")}
                        className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                    >
                        <option value="credit">Credit points</option>
                        <option value="debit">Debit points</option>
                    </select>
                </label>
                <label className="text-sm font-medium text-gray-700">
                    Reason (optional)
                    <input
                        type="text"
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                        placeholder="Recognition for volunteering"
                    />
                </label>
            </div>
            {error && (
                <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                    {error}
                </div>
            )}
            <Button type="submit" disabled={submitting}>
                {submitting ? "Applying…" : "Apply Adjustment"}
            </Button>
        </form>
    );
}

export default function PointsPage() {
    const { user, tokens } = useAuth();
    const accessToken = tokens?.access_token ?? null;
    const orgIds = user?.org_ids ?? [];
    const [selectedOrgId, setSelectedOrgId] = useState(() => orgIds[0] ?? "");

    useEffect(() => {
        if (!selectedOrgId && orgIds.length > 0) {
            setSelectedOrgId(orgIds[0]);
            return;
        }
        if (selectedOrgId && !orgIds.includes(selectedOrgId) && orgIds.length > 0) {
            setSelectedOrgId(orgIds[0]);
        }
    }, [orgIds, selectedOrgId]);

    const [balance, setBalance] = useState<PointsBalance | null>(null);
    const [vouchers, setVouchers] = useState<Voucher[]>([]);

    const [alert, setAlert] = useState<AlertState>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [voucherSubmitting, setVoucherSubmitting] = useState(false);
    const [adjustSubmitting, setAdjustSubmitting] = useState(false);
    const [voucherActionId, setVoucherActionId] = useState<string | null>(null);
    const [voucherEditor, setVoucherEditor] = useState<VoucherEditorState>({
        mode: "create",
        open: false,
        voucher: null,
    });
    const ORG_BALANCES_PAGE_SIZE = 50;
    const ORG_LEDGER_PAGE_SIZE = 50;
    const [orgBalances, setOrgBalances] = useState<OrgBalance[]>([]);
    const [orgBalancesTotal, setOrgBalancesTotal] = useState(0);
    const [orgBalancesHasMore, setOrgBalancesHasMore] = useState(false);
    const [orgBalancesLoading, setOrgBalancesLoading] = useState(false);
    const [orgBalancesLoadingMore, setOrgBalancesLoadingMore] = useState(false);
    const [orgBalancesError, setOrgBalancesError] = useState<string | null>(null);
    const [orgBalanceSearchInput, setOrgBalanceSearchInput] = useState("");
    const [orgBalanceSearch, setOrgBalanceSearch] = useState("");
    const orgBalancesLengthRef = useRef(0);
    const [orgLedger, setOrgLedger] = useState<OrgLedgerEntry[]>([]);
    const [orgLedgerTotal, setOrgLedgerTotal] = useState(0);
    const [orgLedgerHasMore, setOrgLedgerHasMore] = useState(false);
    const [orgLedgerLoading, setOrgLedgerLoading] = useState(false);
    const [orgLedgerLoadingMore, setOrgLedgerLoadingMore] = useState(false);
    const [orgLedgerError, setOrgLedgerError] = useState<string | null>(null);
    const [orgLedgerSearchInput, setOrgLedgerSearchInput] = useState("");
    const [orgLedgerSearch, setOrgLedgerSearch] = useState("");
    const orgLedgerLengthRef = useRef(0);
    const [participantDirectory, setParticipantDirectory] = useState<Record<string, UserSummary>>({});

    const loadOrgBalances = useCallback(
        async ({
            append = false,
            signal,
            identifier,
        }: { append?: boolean; signal?: AbortSignal; identifier?: string } = {}) => {
            if (!accessToken || !selectedOrgId) {
                return false;
            }

            if (!append) {
                setOrgBalancesLoading(true);
                setOrgBalancesError(null);
                orgBalancesLengthRef.current = 0;
            } else {
                setOrgBalancesLoadingMore(true);
            }

            const offset = append ? orgBalancesLengthRef.current : 0;
            const activeIdentifier = identifier ?? orgBalanceSearch;

            try {
                const page = await listOrgBalances({
                    accessToken,
                    orgId: selectedOrgId,
                    limit: ORG_BALANCES_PAGE_SIZE,
                    offset,
                    identifier: activeIdentifier,
                    signal,
                });

                if (signal?.aborted) {
                    return false;
                }

                setOrgBalances((prev) => (append ? [...prev, ...page.items] : page.items));
                orgBalancesLengthRef.current = offset + page.items.length;
                setOrgBalancesTotal(page.total);
                setOrgBalancesHasMore(page.has_more);
                return true;
            } catch (error) {
                if (!(signal?.aborted)) {
                    setOrgBalancesError(getErrorMessage(error));
                }
                return false;
            } finally {
                if (!(signal?.aborted)) {
                    if (append) {
                        setOrgBalancesLoadingMore(false);
                    } else {
                        setOrgBalancesLoading(false);
                    }
                }
            }
        },
        [accessToken, selectedOrgId, orgBalanceSearch]
    );

    const loadOrgLedger = useCallback(
        async ({
            append = false,
            signal,
            identifier,
        }: { append?: boolean; signal?: AbortSignal; identifier?: string } = {}) => {
            if (!accessToken || !selectedOrgId) {
                return false;
            }

            if (!append) {
                setOrgLedgerLoading(true);
                setOrgLedgerError(null);
                orgLedgerLengthRef.current = 0;
            } else {
                setOrgLedgerLoadingMore(true);
            }

            const offset = append ? orgLedgerLengthRef.current : 0;
            const activeIdentifier = identifier ?? orgLedgerSearch;

            try {
                const page = await listOrgLedger({
                    accessToken,
                    orgId: selectedOrgId,
                    limit: ORG_LEDGER_PAGE_SIZE,
                    offset,
                    identifier: activeIdentifier,
                    signal,
                });

                if (signal?.aborted) {
                    return false;
                }

                setOrgLedger((prev) => (append ? [...prev, ...page.items] : page.items));
                orgLedgerLengthRef.current = offset + page.items.length;
                setOrgLedgerTotal(page.total);
                setOrgLedgerHasMore(page.has_more);
                return true;
            } catch (error) {
                if (!(signal?.aborted)) {
                    setOrgLedgerError(getErrorMessage(error));
                }
                return false;
            } finally {
                if (!(signal?.aborted)) {
                    if (append) {
                        setOrgLedgerLoadingMore(false);
                    } else {
                        setOrgLedgerLoading(false);
                    }
                }
            }
        },
        [accessToken, selectedOrgId, orgLedgerSearch]
    );

    const refreshData = useCallback(
        async ({ signal, silently }: RefreshOptions = {}) => {
            if (!accessToken || !selectedOrgId) {
                return false;
            }
            if (!silently) {
                setIsLoading(true);
            }
            try {
                const [balanceRes, vouchersRes] = await Promise.all([
                    getMyPointsBalance({ accessToken, orgId: selectedOrgId, signal }),
                    listVouchers({ accessToken, orgId: selectedOrgId, signal }),
                ]);
                if (signal?.aborted) {
                    return false;
                }
                setBalance(balanceRes);
                setVouchers(Array.isArray(vouchersRes) ? vouchersRes : []);
                const [balancesSuccess, ledgerSuccess] = await Promise.all([
                    loadOrgBalances({ signal }),
                    loadOrgLedger({ signal }),
                ]);
                return balancesSuccess && ledgerSuccess;
            } catch (error) {
                if (!(signal?.aborted)) {
                    setAlert({ type: "error", message: getErrorMessage(error) });
                }
                return false;
            } finally {
                if (!(signal?.aborted) && !silently) {
                    setIsLoading(false);
                }
            }
        },
        [accessToken, selectedOrgId, loadOrgBalances, loadOrgLedger]
    );

    useEffect(() => {
        if (!accessToken || !selectedOrgId) {
            return;
        }
        const controller = new AbortController();
        refreshData({ signal: controller.signal });
        return () => controller.abort();
    }, [accessToken, selectedOrgId, refreshData]);

    useEffect(() => {
        if (!accessToken) {
            setParticipantDirectory({});
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const participants = await listParticipants({ accessToken });
                if (!cancelled) {
                    setParticipantDirectory(() => {
                        const next: Record<string, UserSummary> = {};
                        participants.forEach((participant) => {
                            next[participant.id] = participant;
                        });
                        return next;
                    });
                }
            } catch (error) {
                if (!cancelled) {
                    console.warn("Failed to load participant directory", error);
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [accessToken]);

    const describeParticipant = useCallback(
        (userId: string) => {
            const profile = participantDirectory[userId];
            if (!profile) {
                return { primary: userId, secondary: null, tertiary: null };
            }
            const primary = profile.name || profile.nric || profile.id;
            const secondary = profile.nric && profile.nric !== primary ? profile.nric : null;
            const tertiary = profile.id !== primary ? profile.id : null;
            return { primary, secondary, tertiary };
        },
        [participantDirectory]
    );

    const sortedOrgLedger = useMemo(
        () =>
            [...orgLedger].sort(
                (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
            ),
        [orgLedger]
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

    const currentPoints = balance?.balance ?? 0;

    const handleManualRefresh = useCallback(async () => {
        if (!accessToken || !selectedOrgId) {
            setAlert({ type: "error", message: "Select an organisation to refresh." });
            return;
        }
        setIsRefreshing(true);
        const success = await refreshData({ silently: true });
        setIsRefreshing(false);
        if (success) {
            setAlert({ type: "success", message: "Data refreshed." });
        }
    }, [accessToken, selectedOrgId, refreshData]);

    const handleOrgBalanceSearchSubmit = useCallback(
        async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            if (!accessToken || !selectedOrgId) {
                setAlert({ type: "error", message: "Select an organisation before searching." });
                return;
            }
            const trimmed = orgBalanceSearchInput.trim();
            setOrgBalanceSearch(trimmed);
            await loadOrgBalances({ append: false, identifier: trimmed });
        },
        [accessToken, selectedOrgId, orgBalanceSearchInput, loadOrgBalances]
    );

    const handleOrgBalanceSearchReset = useCallback(async () => {
        if (!accessToken || !selectedOrgId) {
            return;
        }
        setOrgBalanceSearchInput("");
        setOrgBalanceSearch("");
        await loadOrgBalances({ append: false, identifier: "" });
    }, [accessToken, selectedOrgId, loadOrgBalances]);

    const handleLoadMoreBalances = useCallback(async () => {
        if (!orgBalancesHasMore || orgBalancesLoadingMore) {
            return;
        }
        await loadOrgBalances({ append: true });
    }, [orgBalancesHasMore, orgBalancesLoadingMore, loadOrgBalances]);

    const handleOrgLedgerSearchSubmit = useCallback(
        async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            if (!accessToken || !selectedOrgId) {
                setAlert({ type: "error", message: "Select an organisation before searching." });
                return;
            }
            const trimmed = orgLedgerSearchInput.trim();
            setOrgLedgerSearch(trimmed);
            await loadOrgLedger({ append: false, identifier: trimmed });
        },
        [accessToken, selectedOrgId, orgLedgerSearchInput, loadOrgLedger]
    );

    const handleOrgLedgerSearchReset = useCallback(async () => {
        if (!accessToken || !selectedOrgId) {
            return;
        }
        setOrgLedgerSearchInput("");
        setOrgLedgerSearch("");
        await loadOrgLedger({ append: false, identifier: "" });
    }, [accessToken, selectedOrgId, loadOrgLedger]);

    const handleLoadMoreLedger = useCallback(async () => {
        if (!orgLedgerHasMore || orgLedgerLoadingMore) {
            return;
        }
        await loadOrgLedger({ append: true });
    }, [orgLedgerHasMore, orgLedgerLoadingMore, loadOrgLedger]);

    const handleAdjustPoints = useCallback(
        async ({ identifier, delta, reason }: AdjustInput) => {
            if (!accessToken || !selectedOrgId) {
                throw new Error("You must be signed in to adjust points.");
            }
            setAdjustSubmitting(true);
            try {
                await adjustPoints({
                    accessToken,
                    orgId: selectedOrgId,
                    payload: { identifier, delta, reason },
                });
                await refreshData({ silently: true });
                setAlert({ type: "success", message: "Points updated successfully." });
            } catch (error) {
                setAlert({ type: "error", message: getErrorMessage(error) });
                throw error;
            } finally {
                setAdjustSubmitting(false);
            }
        },
        [accessToken, selectedOrgId, refreshData]
    );

    const handleCreateVoucher = useCallback(
        async (payload: VoucherCreatePayload) => {
            if (!accessToken || !selectedOrgId) {
                throw new Error("You must be signed in to manage vouchers.");
            }
            setVoucherSubmitting(true);
            try {
                await createVoucher({ accessToken, orgId: selectedOrgId, payload });
                await refreshData({ silently: true });
                setAlert({ type: "success", message: "Voucher created." });
                setVoucherEditor({ mode: "create", open: false, voucher: null });
            } catch (error) {
                setAlert({ type: "error", message: getErrorMessage(error) });
                throw error;
            } finally {
                setVoucherSubmitting(false);
            }
        },
        [accessToken, selectedOrgId, refreshData]
    );

    const handleUpdateVoucher = useCallback(
        async (payload: VoucherUpdatePayload) => {
            if (!accessToken || !voucherEditor.voucher) {
                throw new Error("Select a voucher to update.");
            }
            setVoucherSubmitting(true);
            try {
                await updateVoucher({
                    accessToken,
                    voucherId: voucherEditor.voucher.id,
                    payload,
                });
                await refreshData({ silently: true });
                setAlert({ type: "success", message: "Voucher updated." });
                setVoucherEditor({ mode: "create", open: false, voucher: null });
            } catch (error) {
                setAlert({ type: "error", message: getErrorMessage(error) });
                throw error;
            } finally {
                setVoucherSubmitting(false);
            }
        },
        [accessToken, refreshData, voucherEditor.voucher]
    );

    const handleToggleVoucher = useCallback(
        async (voucher: Voucher) => {
            if (!accessToken) {
                setAlert({ type: "error", message: "Sign in to update vouchers." });
                return;
            }
            const nextStatus = voucher.status === "active" ? "disabled" : "active";
            setVoucherActionId(voucher.id);
            try {
                await updateVoucher({
                    accessToken,
                    voucherId: voucher.id,
                    payload: { status: nextStatus },
                });
                await refreshData({ silently: true });
                setAlert({
                    type: "success",
                    message:
                        nextStatus === "active"
                            ? "Voucher enabled."
                            : "Voucher disabled.",
                });
            } catch (error) {
                setAlert({ type: "error", message: getErrorMessage(error) });
            } finally {
                setVoucherActionId(null);
            }
        },
        [accessToken, refreshData]
    );

    const hasOrgs = orgIds.length > 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Points & Vouchers</h1>
                    <p className="text-sm text-gray-600">
                        Track participant balances, review ledger activity, and manage redeemable vouchers.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {hasOrgs && (
                        <div className="text-right">
                            <label className="block text-xs uppercase text-gray-500">Organisation</label>
                            <select
                                value={selectedOrgId}
                                onChange={(event) => {
                                    const nextOrgId = event.target.value;
                                    setSelectedOrgId(nextOrgId);
                                    setOrgBalanceSearchInput("");
                                    setOrgBalanceSearch("");
                                    orgBalancesLengthRef.current = 0;
                                    setOrgBalances([]);
                                    setOrgBalancesTotal(0);
                                    setOrgBalancesHasMore(false);
                                    setOrgBalancesError(null);
                                }}
                                className="mt-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                            >
                                {orgIds.map((orgId) => (
                                    <option key={orgId} value={orgId}>
                                        {orgId.slice(0, 8).toUpperCase()}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    <Button
                        type="button"
                        onClick={handleManualRefresh}
                        disabled={isRefreshing || isLoading || !hasOrgs}
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        {isRefreshing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4" />
                        )}
                        Refresh
                    </Button>
                </div>
            </div>

            {alert && (
                <div
                    className={`rounded-2xl border px-4 py-3 text-sm ${
                        alert.type === "success"
                            ? "border-teal-100 bg-teal-50 text-teal-700"
                            : "border-rose-100 bg-rose-50 text-rose-600"
                    }`}
                >
                    {alert.message}
                </div>
            )}

            {!accessToken ? (
                <Card>
                    <p className="text-sm text-gray-600">
                        Sign in to manage points and vouchers for your organisation.
                    </p>
                </Card>
            ) : !hasOrgs ? (
                <Card>
                    <p className="text-sm text-gray-600">
                        You do not belong to any organisations yet. Invite an administrator to add you so
                        that you can manage rewards.
                    </p>
                </Card>
            ) : (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <Card className="p-6 space-y-4">
                            <div className="flex items-center gap-3 text-teal-600">
                                <Coins className="h-6 w-6" />
                                <span className="text-sm font-semibold uppercase">Current Balance</span>
                            </div>
                            <p className="text-4xl font-extrabold text-gray-900">
                                {formatPoints(currentPoints)}
                            </p>
                            {balance?.updated_at && (
                                <p className="text-xs text-gray-500">
                                    Updated {formatDateTime(balance.updated_at)}
                                </p>
                            )}
                            {isLoading && (
                                <p className="text-xs text-gray-500">Loading latest balance…</p>
                            )}
                        </Card>
                        <Card className="p-6 space-y-4 lg:col-span-2">
                            <div className="flex items-center gap-3 text-teal-600">
                                <Gift className="h-6 w-6" />
                                <span className="text-sm font-semibold uppercase">Adjust Points</span>
                            </div>
                            <AdjustPointsForm submitting={adjustSubmitting} onSubmit={handleAdjustPoints} />
                        </Card>
                    </div>

                    <Card className="p-6 space-y-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-teal-600">
                                <Users className="h-5 w-5" />
                                <span className="text-sm font-semibold uppercase">Organisation Balances</span>
                            </div>
                            <form
                                className="flex flex-wrap items-center gap-2"
                                onSubmit={handleOrgBalanceSearchSubmit}
                            >
                                <input
                                    type="text"
                                    value={orgBalanceSearchInput}
                                    onChange={(event) => setOrgBalanceSearchInput(event.target.value)}
                                    className="w-48 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                                    placeholder="NRIC or User ID"
                                />
                                <Button
                                    type="submit"
                                    className="flex items-center gap-2"
                                    disabled={orgBalancesLoading && orgBalances.length === 0}
                                >
                                    {orgBalancesLoading && orgBalances.length === 0 && (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    )}
                                    Search
                                </Button>
                                {orgBalanceSearch && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={handleOrgBalanceSearchReset}
                                        disabled={orgBalancesLoading}
                                    >
                                        Clear
                                    </Button>
                                )}
                            </form>
                        </div>
                        {orgBalancesError && (
                            <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                                {orgBalancesError}
                            </div>
                        )}
                        {orgBalancesLoading && orgBalances.length === 0 ? (
                            <p className="text-sm text-gray-600">Loading organisation balances.</p>
                        ) : orgBalances.length === 0 ? (
                            <p className="text-sm text-gray-600">
                                {orgBalanceSearch
                                    ? "No participants matched your search."
                                    : "No point balances recorded for this organisation yet."}
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead>
                                        <tr className="text-left text-xs font-semibold uppercase text-gray-500">
                                            <th className="px-3 py-2">Participant</th>
                                            <th className="px-3 py-2">Balance</th>
                                            <th className="px-3 py-2">Updated</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {orgBalances.map((entry) => {
                                            const participant = describeParticipant(entry.user_id);
                                            return (
                                                <tr
                                                    key={`${entry.user_id}-${entry.org_id}`}
                                                    className="align-top"
                                                >
                                                    <td className="px-3 py-3 text-gray-800">
                                                        <div className="font-semibold">
                                                            {participant.primary}
                                                        </div>
                                                        {participant.secondary ? (
                                                            <div className="text-xs text-gray-600">
                                                                {participant.secondary}
                                                            </div>
                                                        ) : null}
                                                        {participant.tertiary ? (
                                                            <div className="text-[11px] font-mono text-gray-400 break-all">
                                                                {participant.tertiary}
                                                            </div>
                                                        ) : null}
                                                    </td>
                                                    <td className="px-3 py-3 font-semibold text-gray-900">
                                                        {formatPoints(entry.balance)}
                                                    </td>
                                                    <td className="px-3 py-3 text-gray-500">
                                                        {entry.updated_at
                                                            ? formatDateTime(entry.updated_at)
                                                            : "-"}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
                            <span>
                                Showing {orgBalances.length} of {orgBalancesTotal} participants
                                {orgBalanceSearch ? ` (filter: ${orgBalanceSearch})` : ""}.
                            </span>
                            {orgBalancesHasMore && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleLoadMoreBalances}
                                    disabled={orgBalancesLoadingMore}
                                    className="flex items-center gap-2"
                                >
                                    {orgBalancesLoadingMore && (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    )}
                                    Load more
                                </Button>
                            )}
                        </div>
                    </Card>

                    <Card className="p-6 space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-teal-600">
                                <History className="h-5 w-5" />
                                <span className="text-sm font-semibold uppercase">Points Ledger</span>
                            </div>
                            <form
                                className="flex flex-wrap items-center gap-2"
                                onSubmit={handleOrgLedgerSearchSubmit}
                            >
                                <input
                                    type="text"
                                    value={orgLedgerSearchInput}
                                    onChange={(event) => setOrgLedgerSearchInput(event.target.value)}
                                    className="w-48 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                                    placeholder="NRIC or User ID"
                                />
                                <Button
                                    type="submit"
                                    className="flex items-center gap-2"
                                    disabled={orgLedgerLoading && orgLedger.length === 0}
                                >
                                    {orgLedgerLoading && orgLedger.length === 0 && (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    )}
                                    Search
                                </Button>
                                {orgLedgerSearch && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={handleOrgLedgerSearchReset}
                                        disabled={orgLedgerLoading}
                                    >
                                        Clear
                                    </Button>
                                )}
                            </form>
                        </div>
                        {orgLedgerError && (
                            <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                                {orgLedgerError}
                            </div>
                        )}
                        {orgLedgerLoading && orgLedger.length === 0 ? (
                            <p className="text-sm text-gray-600">Loading ledger entries.</p>
                        ) : orgLedger.length === 0 ? (
                            <p className="text-sm text-gray-600">
                                {orgLedgerSearch
                                    ? "No transactions matched your search."
                                    : "No ledger entries recorded yet."}
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead>
                                        <tr className="text-left text-xs font-semibold uppercase text-gray-500">
                                            <th className="px-3 py-2">When</th>
                                            <th className="px-3 py-2">Participant</th>
                                            <th className="px-3 py-2">Change</th>
                                            <th className="px-3 py-2">Reason</th>
                                            <th className="px-3 py-2">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {sortedOrgLedger.map((entry) => {
                                            const participant = describeParticipant(entry.user_id);
                                            return (
                                                <tr key={entry.id} className="align-top">
                                                    <td className="px-3 py-3 text-gray-700">
                                                        {formatDateTime(entry.occurred_at)}
                                                    </td>
                                                    <td className="px-3 py-3 text-gray-800">
                                                        <div className="font-semibold">
                                                            {participant.primary}
                                                        </div>
                                                        {participant.secondary ? (
                                                            <div className="text-xs text-gray-600">
                                                                {participant.secondary}
                                                            </div>
                                                        ) : null}
                                                        {participant.tertiary ? (
                                                            <div className="text-[11px] font-mono text-gray-400 break-all">
                                                                {participant.tertiary}
                                                            </div>
                                                        ) : null}
                                                    </td>
                                                    <td
                                                        className={`px-3 py-3 font-semibold ${
                                                            entry.delta >= 0
                                                                ? "text-teal-600"
                                                                : "text-rose-600"
                                                        }`}
                                                    >
                                                        {formatDelta(entry.delta)}
                                                    </td>
                                                    <td className="px-3 py-3 text-gray-700">
                                                        {entry.reason ?? "-"}
                                                    </td>
                                                    <td className="px-3 py-3 text-gray-500">
                                                        {entry.details ?? ""}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
                            <span>
                                Showing {orgLedger.length} of {orgLedgerTotal} transactions
                                {orgLedgerSearch ? ` (filter: ${orgLedgerSearch})` : ""}.
                            </span>
                            {orgLedgerHasMore && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleLoadMoreLedger}
                                    disabled={orgLedgerLoadingMore}
                                    className="flex items-center gap-2"
                                >
                                    {orgLedgerLoadingMore && (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    )}
                                    Load more
                                </Button>
                            )}
                        </div>
                    </Card>

                    <Card className="p-6 space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-teal-600">
                                <Gift className="h-5 w-5" />
                                <span className="text-sm font-semibold uppercase">Vouchers</span>
                            </div>
                            <div className="flex gap-2">
                                {voucherEditor.open ? (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="flex items-center gap-2 text-sm"
                                        onClick={() => setVoucherEditor({ mode: "create", open: false, voucher: null })}
                                    >
                                        <X className="h-4 w-4" />
                                        Close
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        className="flex items-center gap-2 text-sm"
                                        onClick={() =>
                                            setVoucherEditor({ mode: "create", open: true, voucher: null })
                                        }
                                    >
                                        <Plus className="h-4 w-4" />
                                        New Voucher
                                    </Button>
                                )}
                            </div>
                        </div>
                        {voucherEditor.open && (
                            <VoucherForm
                                mode={voucherEditor.mode}
                                initial={voucherEditor.voucher}
                                submitting={voucherSubmitting}
                                onSubmit={(payload) =>
                                    voucherEditor.mode === "create"
                                        ? handleCreateVoucher(payload as VoucherCreatePayload)
                                        : handleUpdateVoucher(payload as VoucherUpdatePayload)
                                }
                                onCancel={() => setVoucherEditor({ mode: "create", open: false, voucher: null })}
                            />
                        )}
                        {isLoading && sortedVouchers.length === 0 ? (
                            <p className="text-sm text-gray-600">Loading vouchers…</p>
                        ) : sortedVouchers.length === 0 ? (
                            <p className="text-sm text-gray-600">
                                No vouchers configured yet. Create one to let seniors redeem their points.
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {sortedVouchers.map((voucher) => {
                                    const exhausted =
                                        voucher.total_quantity !== null &&
                                        voucher.redeemed_count >= (voucher.total_quantity ?? 0);
                                    const toggleLabel = voucher.status === "active" ? "Disable" : "Enable";
                                    const toggleVariant = voucher.status === "active" ? "ghost" : "outline";
                                    const disabled = voucherActionId === voucher.id || voucherSubmitting;
                                    return (
                                        <Card key={voucher.id} className="p-5 space-y-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-lg font-semibold text-gray-900">
                                                        {voucher.name}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        Code: <span className="font-mono">{voucher.code}</span>
                                                    </p>
                                                </div>
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                        voucher.status === "active"
                                                            ? "bg-teal-100 text-teal-600"
                                                            : "bg-gray-200 text-gray-600"
                                                    }`}
                                                >
                                                    {voucher.status === "active" ? "Active" : "Disabled"}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                                <span>{formatPoints(voucher.points_cost)}</span>
                                                {voucher.total_quantity !== null && (
                                                    <span>
                                                        {voucher.redeemed_count}/{voucher.total_quantity} claimed
                                                    </span>
                                                )}
                                                {exhausted && (
                                                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
                                                        Out of stock
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    className="flex items-center gap-2 text-sm"
                                                    onClick={() =>
                                                        setVoucherEditor({
                                                            mode: "edit",
                                                            open: true,
                                                            voucher,
                                                        })
                                                    }
                                                    disabled={voucherSubmitting}
                                                >
                                                    <Edit3 className="h-4 w-4" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={toggleVariant}
                                                    className="flex items-center gap-2 text-sm"
                                                    onClick={() => handleToggleVoucher(voucher)}
                                                    disabled={disabled}
                                                >
                                                    {voucherActionId === voucher.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <RefreshCw className="h-4 w-4" />
                                                    )}
                                                    {toggleLabel}
                                                </Button>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                </>
            )}
        </div>
    );
}
