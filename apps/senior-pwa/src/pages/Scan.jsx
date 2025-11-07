import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle,
    Clock,
    History,
    Loader2,
    QrCode,
    RefreshCcw,
} from "lucide-react";
import { Button } from "@silvertrails/ui";
import QRScanner from "../components/QRScanner.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
    extractTokenFromScan,
    listMyCheckins,
    scanCheckin,
} from "../services/checkins.js";

function formatDateTime(value) {
    if (!value) {
        return "Date unavailable";
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

function shortenId(id) {
    if (!id) {
        return "—";
    }
    return String(id).slice(0, 8).toUpperCase();
}

export default function Scan() {
    const navigate = useNavigate();
    const { tokens, user } = useAuth();
    const accessToken = tokens?.access_token;
    const orgIds = user?.org_ids ?? [];
    const pendingOrgAssignment = !orgIds || orgIds.length === 0;

    const [manualToken, setManualToken] = useState("");
    const [lastCheckin, setLastCheckin] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState("");

    const pendingTokenRef = useRef("");

    const fetchHistory = useCallback(
        async ({ signal } = {}) => {
            if (!accessToken || pendingOrgAssignment) {
                setHistory([]);
                return;
            }
            setHistoryLoading(true);
            setHistoryError("");
            try {
                const records = await listMyCheckins({ accessToken, signal });
                if (!(signal?.aborted)) {
                    setHistory(Array.isArray(records) ? records : []);
                }
            } catch (err) {
                if (!(signal?.aborted)) {
                    setHistoryError(
                        err?.message ?? "Unable to load your recent check-ins."
                    );
                }
            } finally {
                if (!(signal?.aborted)) {
                    setHistoryLoading(false);
                }
            }
        },
        [accessToken, pendingOrgAssignment]
    );

    useEffect(() => {
        if (!accessToken || pendingOrgAssignment) {
            setHistory([]);
            return;
        }
        const controller = new AbortController();
        fetchHistory({ signal: controller.signal });
        return () => controller.abort();
    }, [accessToken, fetchHistory, pendingOrgAssignment]);

    const submitToken = useCallback(
        async (token) => {
            if (!token) {
                setError("We could not read the QR code. Please try again.");
                return;
            }
            if (!accessToken) {
                setError("Please sign in again to scan QR codes.");
                return;
            }
            if (pendingOrgAssignment) {
                setError("Join an organisation before scanning QR codes.");
                return;
            }
            if (loading) {
                return;
            }
            pendingTokenRef.current = token;
            setLoading(true);
            setError("");
            try {
                const record = await scanCheckin({ accessToken, token });
                setLastCheckin(record);
                setManualToken("");
                pendingTokenRef.current = "";
                fetchHistory().catch(() => {});
            } catch (err) {
                pendingTokenRef.current = "";
                setError(
                    err?.message ??
                        "Unable to complete the check-in. Please try another QR code."
                );
            } finally {
                setLoading(false);
            }
        },
        [accessToken, fetchHistory, loading, pendingOrgAssignment]
    );

    const handleScanResult = useCallback(
        (rawValue) => {
            if (loading || lastCheckin) {
                return;
            }
            const token = extractTokenFromScan(rawValue);
            if (!token) {
                setError("We could not read the QR code. Please try again.");
                return;
            }
            if (pendingTokenRef.current && pendingTokenRef.current === token) {
                return;
            }
            submitToken(token);
        },
        [loading, lastCheckin, submitToken]
    );

    const handleManualSubmit = useCallback(
        (event) => {
            event.preventDefault();
            const token = extractTokenFromScan(manualToken);
            submitToken(token);
        },
        [manualToken, submitToken]
    );

    const handleBackHome = useCallback(() => {
        navigate("/home");
    }, [navigate]);

    const resetScanner = useCallback(() => {
        setLastCheckin(null);
        setError("");
        pendingTokenRef.current = "";
    }, []);

    const recentHistory = useMemo(() => history.slice(0, 5), [history]);
    const hasHistory = recentHistory.length > 0;

    if (pendingOrgAssignment) {
        return (
            <div className="min-h-[100svh] bg-teal-900 flex flex-col items-center px-4 py-8">
                <button
                    type="button"
                    onClick={() => navigate("/home")}
                    className="self-start mb-6 flex items-center gap-2 text-white/90 hover:text-white transition"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-sm font-medium">Back</span>
                </button>
                <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4 text-gray-800">
                    <div className="flex items-center gap-3 text-amber-700">
                        <AlertCircle className="w-6 h-6" />
                        <h1 className="text-xl font-semibold">You need an organisation first</h1>
                    </div>
                    <p className="text-sm leading-6 text-gray-600">
                        We can only record check-ins after your organiser adds you to an organisation. Enter the invite link they shared with you or ask them to send a new one.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            className="flex-1 bg-teal-500 hover:bg-teal-600 text-white"
                            onClick={() => navigate("/join")}
                        >
                            Enter invite code
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50"
                            onClick={() => navigate("/home")}
                        >
                            Back to Home
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`min-h-[100svh] flex flex-col items-center px-4 py-8 transition-colors duration-500 ${lastCheckin ? "bg-gradient-to-b from-white to-cyan-50" : "bg-teal-800"
                }`}
        >
            {!lastCheckin && (
                <button
                    type="button"
                    onClick={handleBackHome}
                    className="self-start mb-6 flex items-center gap-2 text-white/90 hover:text-white transition"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-sm font-medium">Back</span>
                </button>
            )}

            {lastCheckin ? (
                <div className="w-full max-w-md text-center flex flex-col items-center gap-6">
                    <div className="flex flex-col items-center gap-4 bg-white/90 backdrop-blur-sm rounded-3xl px-6 py-10 shadow-xl">
                        <div className="bg-green-100 rounded-full p-5 shadow">
                            <CheckCircle className="w-16 h-16 text-green-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">
                                Check-in successful!
                            </h2>
                            <p className="text-gray-600 mt-2">
                                {formatDateTime(lastCheckin.checked_at)}
                            </p>
                        </div>
                        <div className="text-sm text-gray-600 bg-gray-100 rounded-2xl px-4 py-3 text-left w-full">
                            <p>
                                <span className="font-semibold text-gray-700">Trail:</span>{" "}
                                {shortenId(lastCheckin.trail_id)}
                            </p>
                            <p className="mt-1">
                                <span className="font-semibold text-gray-700">Organisation:</span>{" "}
                                {shortenId(lastCheckin.org_id)}
                            </p>
                            <p className="mt-1">
                                <span className="font-semibold text-gray-700">Method:</span>{" "}
                                {lastCheckin.method}
                            </p>
                        </div>
                        <p className="text-sm text-gray-500">
                            Your activity has been recorded. Points will appear once the organiser confirms your attendance.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <Button
                            onClick={handleBackHome}
                            className="flex-1 bg-teal-400 hover:bg-cyan-400 text-white text-base py-3"
                        >
                            Back to Home
                        </Button>
                        <Button
                            onClick={resetScanner}
                            className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-base py-3"
                        >
                            Scan Another
                        </Button>
                    </div>
                    <Button
                        onClick={() => {
                            resetScanner();
                            fetchHistory().catch(() => {});
                        }}
                        className="w-full bg-white/80 border border-teal-200 text-teal-700 hover:bg-white text-base py-3"
                    >
                        <History className="w-4 h-4 mr-2" />
                        View recent check-ins
                    </Button>
                </div>
            ) : (
                <div className="w-full max-w-md flex flex-col gap-6 items-center">
                    <div className="w-full bg-white/95 backdrop-blur-sm rounded-3xl px-6 py-6 shadow-xl">
                        <div className="flex items-center gap-3 text-teal-700">
                            <QrCode className="w-6 h-6" />
                            <h2 className="text-xl font-semibold">Scan QR to mark activity</h2>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            Hold your device steady and position the QR code inside the frame. We will record your check-in automatically.
                        </p>
                        <div className="mt-5 rounded-2xl border border-gray-200 overflow-hidden bg-black">
                            <QRScanner onResult={handleScanResult} />
                        </div>
                        {loading && (
                            <div className="mt-4 flex items-center justify-center gap-2 text-teal-700 text-sm">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processing your check-in...
                            </div>
                        )}
                        {error && (
                            <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 text-rose-600 px-3 py-2 text-sm">
                                <AlertCircle className="w-4 h-4" />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>

                    <form
                        onSubmit={handleManualSubmit}
                        className="w-full bg-white/95 backdrop-blur-sm rounded-3xl px-6 py-6 shadow-xl"
                    >
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            Enter code manually
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Paste the token or QR link if your camera is unavailable.
                        </p>
                        <div className="mt-4 flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                value={manualToken}
                                onChange={(event) => setManualToken(event.target.value)}
                                className="flex-1 rounded-xl border border-gray-300 px-3 py-3 text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none"
                                placeholder="e.g. /checkin/scan?token=..."
                                disabled={loading}
                            />
                            <Button
                                type="submit"
                                className="bg-teal-400 hover:bg-cyan-400 text-white px-6 py-3 rounded-xl"
                                disabled={loading}
                            >
                                Submit code
                            </Button>
                        </div>
                    </form>

                    <div className="w-full bg-white/95 backdrop-blur-sm rounded-3xl px-6 py-6 shadow-xl">
                        <div className="flex items-center justify-between">
                            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                                <Clock className="w-5 h-5 text-teal-600" />
                                Recent check-ins
                            </h3>
                            <button
                                type="button"
                                onClick={() => fetchHistory().catch(() => {})}
                                className="flex items-center gap-1 text-sm text-teal-700 hover:text-teal-900"
                            >
                                <RefreshCcw className={`w-4 h-4 ${historyLoading ? "animate-spin" : ""}`} />
                                Refresh
                            </button>
                        </div>

                        {historyError && (
                            <div className="mt-3 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                                {historyError}
                            </div>
                        )}

                        {!historyError && !hasHistory && !historyLoading && (
                            <p className="mt-3 text-sm text-gray-600">
                                You have not checked in to any trails yet. Scan a QR code to get started!
                            </p>
                        )}

                        {hasHistory && (
                            <ul className="mt-4 space-y-3">
                                {recentHistory.map((item) => (
                                    <li
                                        key={item.id}
                                        className="rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-700"
                                    >
                                        <div className="flex justify-between gap-2">
                                            <span className="font-medium text-gray-800">
                                                Trail {shortenId(item.trail_id)}
                                            </span>
                                            <span className="text-xs text-gray-500 uppercase">
                                                {item.method}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 mt-1">
                                            {formatDateTime(item.checked_at)}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
