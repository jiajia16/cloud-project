import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import Layout from "../components/Layout.jsx";
import { Card, Tabs, Button } from "@silvertrails/ui";
import { Medal, RefreshCcw, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { formatPoints } from "@silvertrails/utils";
import { getSystemLeaderboard } from "../services/leaderboard.js";

const TAB_OPTIONS = ["All Seniors", "My CC"];

function displayName(entry, currentUserId) {
    if (entry.user_id === currentUserId) {
        return "You";
    }
    return `Participant ${entry.user_id.slice(0, 6).toUpperCase()}`;
}

export default function Leaderboard() {
    const { tokens, user } = useAuth();
    const accessToken = tokens?.access_token;

    const [activeTab, setActiveTab] = useState(TAB_OPTIONS[0]);
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchLeaders = useCallback(
        async ({ signal } = {}) => {
            if (!accessToken) {
                return;
            }
            setLoading(true);
            setError("");
            try {
                const data = await getSystemLeaderboard({ accessToken, signal, limit: 50 });
                if (!signal?.aborted) {
                    setLeaders(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                if (!signal?.aborted) {
                    setError(err?.message ?? "Unable to load leaderboard right now.");
                }
            } finally {
                if (!signal?.aborted) {
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
        fetchLeaders({ signal: controller.signal });
        return () => controller.abort();
    }, [accessToken, fetchLeaders]);

    const topThree = useMemo(() => leaders.slice(0, 3), [leaders]);
    const highlightRank = useMemo(() => {
        if (!user?.id) {
            return null;
        }
        const match = leaders.find((entry) => entry.user_id === user.id);
        return match?.rank ?? null;
    }, [leaders, user?.id]);

    const renderSystemLeaderboard = () => (
        <>
            <Card className="mb-3 mt-4">
                {loading && leaders.length === 0 ? (
                    <p className="text-sm text-gray-600">Loading leaderboard…</p>
                ) : error && leaders.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-rose-600">
                        <AlertCircle className="w-4 h-4" />
                        <span>{error}</span>
                    </div>
                ) : topThree.length === 0 ? (
                    <p className="text-sm text-gray-600">
                        No rankings yet. Complete some activities to appear on the leaderboard!
                    </p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                        {topThree.map((entry, index) => {
                            const medalColors = ["text-yellow-400", "text-gray-400", "text-amber-700"];
                            return (
                                <div key={entry.user_id} className="p-3">
                                    <Medal className={`w-10 h-10 mx-auto ${medalColors[index] ?? "text-teal-500"}`} />
                                    <div className="font-semibold mt-2">
                                        {displayName(entry, user?.id)}
                                    </div>
                                    <div className="text-sm text-gray-500">Rank #{entry.rank}</div>
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
                    <h3 className="text-lg font-semibold text-gray-800">Top Participants</h3>
                    <Button
                        onClick={() => fetchLeaders()}
                        disabled={loading}
                        className="bg-white border border-teal-200 text-teal-700 hover:bg-teal-50 text-sm flex items-center gap-2"
                    >
                        <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
                {error && leaders.length > 0 && (
                    <div className="mb-3 text-sm text-rose-600 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>{error}</span>
                    </div>
                )}
                {leaders.length === 0 ? (
                    <p className="text-sm text-gray-600">No participants on the board yet.</p>
                ) : (
                    <ul className="divide-y">
                        {leaders.map((entry) => {
                            const isCurrentUser = entry.user_id === user?.id;
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
                                        <span className={`font-medium ${isCurrentUser ? "text-teal-700" : "text-gray-800"}`}>
                                            {displayName(entry, user?.id)}
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
                        Keep going! You’re currently ranked #{highlightRank}.
                    </p>
                )}
            </Card>
        </>
    );

    const renderOrgLeaderboardPlaceholder = () => (
        <Card className="mt-4 p-5 text-sm text-gray-600">
            Organiser leaderboard will appear here once organiser features are available.
        </Card>
    );

    return (
        <Layout title="Leaderboard">
            <div className="pb-24 px-4 space-y-4">
                <Tabs
                    tabs={TAB_OPTIONS}
                    active={activeTab}
                    onChange={setActiveTab}
                    className="text-gray-800 font-medium"
                />

                {!accessToken ? (
                    <Card className="p-4 text-sm text-gray-600">
                        Please sign in to view the leaderboard.
                    </Card>
                ) : activeTab === "All Seniors" ? (
                    renderSystemLeaderboard()
                ) : (
                    renderOrgLeaderboardPlaceholder()
                )}
            </div>
        </Layout>
    );
}
