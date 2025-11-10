"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Trophy, Users, Clock, RefreshCw, BarChart3, Gift, Activity } from "lucide-react";
import { Button, Card } from "@silvertrails/ui";
import { useAuth } from "../../context/AuthContext";
import {
  getOrgLeaderboard,
  getSystemLeaderboard,
  getTrailAttendance,
  getOrgAttendanceSummary,
  type LeaderboardRow,
  type AttendanceEntry,
  type AttendanceSummary,
} from "../../services/leaderboard";
import { listTrails, getTrailsOverview, type Trail, type TrailsOverview } from "../../services/trails";
import {
  listOrganisations,
  getOrganisationStats,
  type OrganisationSummary,
  type OrganisationStats,
} from "../../services/auth";
import {
  getOrgPointsSummary,
  getRecentRedemptions,
  type PointsSummary,
  type RedemptionItem,
} from "../../services/points";

type LoadingState = {
  loading: boolean;
  error: string | null;
};

function formatUserId(value: string) {
  if (!value) return "Unknown";
  if (value.length <= 12) return value;
  // Use ASCII-only separator to avoid any encoding issues:
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
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

function formatShortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-SG", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export default function InsightsPage() {
  const { user, tokens } = useAuth();
  const accessToken = tokens?.access_token ?? null;
  const orgIds = user?.org_ids ?? [];
  const SUMMARY_DAYS = 30;

  const [systemRows, setSystemRows] = useState<LeaderboardRow[]>([]);
  const [orgRows, setOrgRows] = useState<LeaderboardRow[]>([]);
  const [attendanceRows, setAttendanceRows] = useState<AttendanceEntry[]>([]);
  const [trails, setTrails] = useState<Trail[]>([]);
  const [organisations, setOrganisations] = useState<OrganisationSummary[]>([]);
  const [orgStats, setOrgStats] = useState<OrganisationStats | null>(null);
  const [trailsOverviewData, setTrailsOverviewData] = useState<TrailsOverview | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [pointsSummary, setPointsSummary] = useState<PointsSummary | null>(null);
  const [recentRedemptions, setRecentRedemptions] = useState<RedemptionItem[]>([]);

  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [selectedTrailId, setSelectedTrailId] = useState<string>("");

  const [systemState, setSystemState] = useState<LoadingState>({ loading: false, error: null });
  const [orgState, setOrgState] = useState<LoadingState>({ loading: false, error: null });
  const [attendanceState, setAttendanceState] = useState<LoadingState>({ loading: false, error: null });
  const [snapshotState, setSnapshotState] = useState<LoadingState>({ loading: false, error: null });
  const [overviewState, setOverviewState] = useState<LoadingState>({ loading: false, error: null });
  const [attendanceSummaryState, setAttendanceSummaryState] = useState<LoadingState>({ loading: false, error: null });
  const [pointsSummaryState, setPointsSummaryState] = useState<LoadingState>({ loading: false, error: null });
  const [redemptionsState, setRedemptionsState] = useState<LoadingState>({ loading: false, error: null });

  const [systemReloadToken, setSystemReloadToken] = useState(0);
  const [orgReloadToken, setOrgReloadToken] = useState(0);
  const [attendanceReloadToken, setAttendanceReloadToken] = useState(0);

  // Load organisations available to this user
  useEffect(() => {
    if (!accessToken) {
      setOrganisations([]);
      return;
    }
    const controller = new AbortController();
    listOrganisations({ accessToken, signal: controller.signal })
      .then((items) => {
        setOrganisations(Array.isArray(items) ? items : []);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setOrganisations([]);
        }
      });
    return () => controller.abort();
  }, [accessToken]);

  // Build a stable list of org options (merge user org ids + fetched orgs)
  const availableOrgOptions = useMemo(() => {
    const map = new Map<string, OrganisationSummary>();
    organisations.forEach((org) => map.set(org.id, org));
    orgIds.forEach((id) => {
      if (!map.has(id)) {
        map.set(id, { id, name: `Organisation ${String(id).slice(0, 6)}...` });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [organisations, orgIds]);

  const selectedOrgMeta = useMemo(() => {
    if (!selectedOrgId) return null;
    return availableOrgOptions.find((org) => org.id === selectedOrgId) ?? null;
  }, [availableOrgOptions, selectedOrgId]);

  // Default/select a valid org id
  useEffect(() => {
    if (!selectedOrgId && availableOrgOptions.length > 0) {
      setSelectedOrgId(availableOrgOptions[0].id);
    } else if (
      selectedOrgId &&
      availableOrgOptions.length > 0 &&
      !availableOrgOptions.some((org) => org.id === selectedOrgId)
    ) {
      setSelectedOrgId(availableOrgOptions[0].id);
    }
  }, [availableOrgOptions, selectedOrgId]);

  const selectedOrgIsMember = useMemo(() => {
    if (!selectedOrgId) return false;
    return orgIds.map(String).includes(String(selectedOrgId));
  }, [orgIds, selectedOrgId]);

  const numberFormatter = useMemo(() => new Intl.NumberFormat("en-SG"), []);

  // System leaderboard (not rendered yet in UI but kept to preserve current behavior)
  useEffect(() => {
    if (!accessToken) {
      setSystemRows([]);
      return;
    }
    const controller = new AbortController();
    setSystemState({ loading: true, error: null });
    getSystemLeaderboard({ accessToken, limit: 10, signal: controller.signal })
      .then((rows) => setSystemRows(rows))
      .catch((error) => {
        if (controller.signal.aborted) return;
        setSystemState({
          loading: false,
          error: error instanceof Error ? error.message : "Unable to load system leaderboard.",
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setSystemState((prev) => ({ ...prev, loading: false }));
        }
      });
    return () => controller.abort();
  }, [accessToken, systemReloadToken]);

  // Org leaderboard and trails for selected org
  useEffect(() => {
    if (!accessToken || !selectedOrgId) {
      setOrgRows([]);
      setTrails([]);
      setSelectedTrailId("");
      return;
    }
    const controller = new AbortController();
    setOrgState({ loading: true, error: null });

    getOrgLeaderboard({ accessToken, orgId: selectedOrgId, limit: 10, signal: controller.signal })
      .then((rows) => setOrgRows(rows))
      .catch((error) => {
        if (controller.signal.aborted) return;
        setOrgState({
          loading: false,
          error: error instanceof Error ? error.message : "Unable to load organisation leaderboard.",
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setOrgState((prev) => ({ ...prev, loading: false }));
        }
      });

    if (selectedOrgIsMember) {
      listTrails({ accessToken, orgId: selectedOrgId, signal: controller.signal })
        .then((trailList) => {
          setTrails(trailList);
          if (trailList.length > 0 && !trailList.some((trail) => trail.id === selectedTrailId)) {
            setSelectedTrailId(trailList[0].id);
          }
          if (trailList.length === 0) {
            setSelectedTrailId("");
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setTrails([]);
            setSelectedTrailId("");
          }
        });
    } else {
      setTrails([]);
      setSelectedTrailId("");
    }

    return () => controller.abort();
  }, [accessToken, selectedOrgId, orgReloadToken, selectedOrgIsMember, selectedTrailId]);

  // Organisation snapshot
  useEffect(() => {
    if (!accessToken || !selectedOrgId) {
      setOrgStats(null);
      setSnapshotState({ loading: false, error: null });
      return;
    }
    const controller = new AbortController();
    setSnapshotState({ loading: true, error: null });
    getOrganisationStats({ accessToken, orgId: selectedOrgId, signal: controller.signal })
      .then((data) => setOrgStats(data))
      .catch((error) => {
        if (controller.signal.aborted) return;
        setSnapshotState({
          loading: false,
          error: error instanceof Error ? error.message : "Unable to load organisation snapshot.",
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setSnapshotState((prev) => ({ ...prev, loading: false }));
        }
      });
    return () => controller.abort();
  }, [accessToken, selectedOrgId]);

  // Trails overview
  useEffect(() => {
    if (!accessToken || !selectedOrgId) {
      setTrailsOverviewData(null);
      setOverviewState({ loading: false, error: null });
      return;
    }
    const controller = new AbortController();
    setOverviewState({ loading: true, error: null });
    getTrailsOverview({ accessToken, orgId: selectedOrgId, signal: controller.signal })
      .then((data) => setTrailsOverviewData(data))
      .catch((error) => {
        if (controller.signal.aborted) return;
        setOverviewState({
          loading: false,
          error: error instanceof Error ? error.message : "Unable to load trail overview.",
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setOverviewState((prev) => ({ ...prev, loading: false }));
        }
      });
    return () => controller.abort();
  }, [accessToken, selectedOrgId]);

  // Attendance summary
  useEffect(() => {
    if (!accessToken || !selectedOrgId) {
      setAttendanceSummary(null);
      setAttendanceSummaryState({ loading: false, error: null });
      return;
    }
    const controller = new AbortController();
    setAttendanceSummaryState({ loading: true, error: null });
    getOrgAttendanceSummary({
      accessToken,
      orgId: selectedOrgId,
      days: SUMMARY_DAYS,
      signal: controller.signal,
    })
      .then((data) => setAttendanceSummary(data))
      .catch((error) => {
        if (controller.signal.aborted) return;
        setAttendanceSummaryState({
          loading: false,
          error: error instanceof Error ? error.message : "Unable to load attendance summary.",
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setAttendanceSummaryState((prev) => ({ ...prev, loading: false }));
        }
      });
    return () => controller.abort();
  }, [accessToken, selectedOrgId, SUMMARY_DAYS]);

  // Points summary and recent redemptions
  useEffect(() => {
    if (!accessToken || !selectedOrgId) {
      setPointsSummary(null);
      setPointsSummaryState({ loading: false, error: null });
      return;
    }
    const controller = new AbortController();
    setPointsSummaryState({ loading: true, error: null });
    getOrgPointsSummary({ accessToken, orgId: selectedOrgId, signal: controller.signal })
      .then((data) => setPointsSummary(data))
      .catch((error) => {
        if (controller.signal.aborted) return;
        setPointsSummaryState({
          loading: false,
          error: error instanceof Error ? error.message : "Unable to load points summary.",
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setPointsSummaryState((prev) => ({ ...prev, loading: false }));
        }
      });
    return () => controller.abort();
  }, [accessToken, selectedOrgId]);

  useEffect(() => {
    if (!accessToken || !selectedOrgId) {
      setRecentRedemptions([]);
      setRedemptionsState({ loading: false, error: null });
      return;
    }
    const controller = new AbortController();
    setRedemptionsState({ loading: true, error: null });
    getRecentRedemptions({ accessToken, orgId: selectedOrgId, limit: 6, signal: controller.signal })
      .then((items) => setRecentRedemptions(items))
      .catch((error) => {
        if (controller.signal.aborted) return;
        setRedemptionsState({
          loading: false,
          error: error instanceof Error ? error.message : "Unable to load recent redemptions.",
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setRedemptionsState((prev) => ({ ...prev, loading: false }));
        }
      });
    return () => controller.abort();
  }, [accessToken, selectedOrgId]);

  // Attendance for selected trail (only if member of org)
  useEffect(() => {
    if (!accessToken || !selectedOrgId || !selectedTrailId || !selectedOrgIsMember) {
      setAttendanceRows([]);
      return;
    }
    const controller = new AbortController();
    setAttendanceState({ loading: true, error: null });

    getTrailAttendance({ accessToken, trailId: selectedTrailId, orgId: selectedOrgId, signal: controller.signal })
      .then((rows) => setAttendanceRows(rows))
      .catch((error) => {
        if (controller.signal.aborted) return;
        setAttendanceState({
          loading: false,
          error: error instanceof Error ? error.message : "Unable to load attendance.",
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setAttendanceState((prev) => ({ ...prev, loading: false }));
        }
      });

    return () => controller.abort();
  }, [accessToken, selectedOrgId, selectedTrailId, attendanceReloadToken, selectedOrgIsMember]);

  const selectedOrgTrails = useMemo(
    () => (selectedOrgIsMember ? trails.filter((trail) => !selectedOrgId || trail.org_id === selectedOrgId) : []),
    [selectedOrgId, selectedOrgIsMember, trails]
  );

  const attendanceTrailBreakdown = useMemo(() => {
    if (!attendanceSummary) return [];
    return attendanceSummary.per_trail.slice(0, 5);
  }, [attendanceSummary]);

  const attendanceDaily = useMemo(() => {
    if (!attendanceSummary) return [];
    return attendanceSummary.daily.slice(-7);
  }, [attendanceSummary]);

  const topEarners = useMemo(() => {
    if (!pointsSummary) return [];
    return pointsSummary.top_earners.slice(0, 5);
  }, [pointsSummary]);

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
        <div className="flex flex-col gap-1 text-gray-800">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-500" />
            <div>
              <h2 className="text-lg font-semibold">Organisation Snapshot</h2>
              {selectedOrgMeta ? (
                <p className="text-sm text-gray-500">{selectedOrgMeta.name}</p>
              ) : null}
            </div>
          </div>
        </div>
        {!canInteract ? (
          <p className="text-sm text-gray-600">Sign in to view organisation insights.</p>
        ) : !selectedOrgId ? (
          <p className="text-sm text-gray-600">Select an organisation to load its metrics.</p>
        ) : snapshotState.error ? (
          <p className="text-sm text-rose-600">{snapshotState.error}</p>
        ) : snapshotState.loading && !orgStats ? (
          <p className="text-sm text-gray-600">Loading organisation snapshot.</p>
        ) : !orgStats ? (
          <p className="text-sm text-gray-600">Membership information is unavailable for this organisation.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-600">Total members</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {numberFormatter.format(orgStats.total_members)}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-600">Organisers</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {numberFormatter.format(orgStats.organisers)}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-600">Participants</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {numberFormatter.format(orgStats.attendees)}
              </p>
            </div>
          </div>
        )}
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center gap-2 text-gray-800">
          <Activity className="h-5 w-5 text-indigo-500" />
          <div>
            <h2 className="text-lg font-semibold">Attendance Summary</h2>
            <p className="text-sm text-gray-500">Last {SUMMARY_DAYS} days</p>
          </div>
        </div>
        {!canInteract ? (
          <p className="text-sm text-gray-600">Sign in to view attendance trends.</p>
        ) : !selectedOrgId ? (
          <p className="text-sm text-gray-600">Select an organisation to view attendance trends.</p>
        ) : attendanceSummaryState.error ? (
          <p className="text-sm text-rose-600">{attendanceSummaryState.error}</p>
        ) : attendanceSummaryState.loading && !attendanceSummary ? (
          <p className="text-sm text-gray-600">Loading attendance summary.</p>
        ) : !attendanceSummary ? (
          <p className="text-sm text-gray-600">No check-ins recorded in this period.</p>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-600">Check-ins</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {numberFormatter.format(attendanceSummary.total_checkins)}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-600">Unique participants</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {numberFormatter.format(attendanceSummary.unique_participants)}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-600">Last check-in</p>
                <p className="mt-1 text-base font-semibold text-gray-900">
                  {attendanceSummary.last_checkin_at ? formatDateTime(attendanceSummary.last_checkin_at) : "—"}
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Top trails</h3>
                {attendanceTrailBreakdown.length === 0 ? (
                  <p className="text-sm text-gray-600">No trail-level activity yet.</p>
                ) : (
                  <ul className="mt-2 space-y-2 text-sm text-gray-700">
                    {attendanceTrailBreakdown.map((row) => (
                      <li key={row.trail_id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                        <div>
                          <p className="font-mono text-xs text-gray-600">{formatUserId(row.trail_id)}</p>
                          <p className="text-xs text-gray-500">{row.unique_participants} participants</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{row.checkins}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Daily trend</h3>
                {attendanceDaily.length === 0 ? (
                  <p className="text-sm text-gray-600">No check-ins to chart.</p>
                ) : (
                  <ul className="mt-2 space-y-2 text-sm text-gray-700">
                    {attendanceDaily.map((row) => (
                      <li key={row.day} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                        <span>{formatShortDate(row.day)}</span>
                        <span className="font-semibold">{row.checkins}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center gap-2 text-gray-800">
          <BarChart3 className="h-5 w-5 text-indigo-500" />
          <div>
            <h2 className="text-lg font-semibold">Trail Overview</h2>
            <p className="text-sm text-gray-500">Published vs capacity</p>
          </div>
        </div>
        {!canInteract ? (
          <p className="text-sm text-gray-600">Sign in to review trail stats.</p>
        ) : !selectedOrgId ? (
          <p className="text-sm text-gray-600">Select an organisation to view its trail portfolio.</p>
        ) : overviewState.error ? (
          <p className="text-sm text-rose-600">{overviewState.error}</p>
        ) : overviewState.loading && !trailsOverviewData ? (
          <p className="text-sm text-gray-600">Loading trail overview.</p>
        ) : !trailsOverviewData ? (
          <p className="text-sm text-gray-600">No trails found for this organisation.</p>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-600">Published</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {numberFormatter.format(trailsOverviewData.published)}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-600">Draft</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {numberFormatter.format(trailsOverviewData.draft)}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-600">Closed</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {numberFormatter.format(trailsOverviewData.closed)}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-600">Confirmed seats</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {numberFormatter.format(trailsOverviewData.confirmed_registrations)}
                </p>
                <p className="text-xs text-gray-500">
                  of {numberFormatter.format(trailsOverviewData.total_capacity)} capacity
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Upcoming published trails</h3>
              {trailsOverviewData.upcoming.length === 0 ? (
                <p className="text-sm text-gray-600">No published trails scheduled.</p>
              ) : (
                <ul className="mt-2 space-y-2 text-sm text-gray-700">
                  {trailsOverviewData.upcoming.map((trail) => (
                    <li key={trail.id} className="rounded-lg bg-gray-50 px-3 py-2">
                      <p className="font-semibold text-gray-900">{trail.title}</p>
                      <p className="text-xs text-gray-500">{formatDateTime(trail.starts_at)}</p>
                      <p className="text-xs text-gray-500">
                        {trail.confirmed_registrations}/{trail.capacity} confirmed
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center gap-2 text-gray-800">
          <Gift className="h-5 w-5 text-indigo-500" />
          <div>
            <h2 className="text-lg font-semibold">Points & Rewards</h2>
            {pointsSummary ? (
              <p className="text-xs text-gray-500">
                {formatDateTime(pointsSummary.range_start)} – {formatDateTime(pointsSummary.range_end)}
              </p>
            ) : null}
          </div>
        </div>
        {!canInteract ? (
          <p className="text-sm text-gray-600">Sign in to track points flow.</p>
        ) : !selectedOrgId ? (
          <p className="text-sm text-gray-600">Select an organisation to show points activity.</p>
        ) : pointsSummaryState.error ? (
          <p className="text-sm text-rose-600">{pointsSummaryState.error}</p>
        ) : pointsSummaryState.loading && !pointsSummary ? (
          <p className="text-sm text-gray-600">Loading points summary.</p>
        ) : !pointsSummary ? (
          <p className="text-sm text-gray-600">No points movement recorded.</p>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-600">Awarded</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {numberFormatter.format(pointsSummary.awarded_total)}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-600">Redeemed</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {numberFormatter.format(pointsSummary.redeemed_total)}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-600">Net</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {numberFormatter.format(pointsSummary.net_delta)}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-600">Free rewards</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {numberFormatter.format(pointsSummary.free_redemptions)}
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Top earners</h3>
                {topEarners.length === 0 ? (
                  <p className="text-sm text-gray-600">No positive adjustments this period.</p>
                ) : (
                  <ul className="mt-2 space-y-2 text-sm text-gray-700">
                    {topEarners.map((row) => (
                      <li key={row.user_id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                        <span className="font-mono text-xs text-gray-600">{formatUserId(row.user_id)}</span>
                        <span className="font-semibold text-gray-900">{numberFormatter.format(row.total_awarded)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Recent redemptions</h3>
                {redemptionsState.error ? (
                  <p className="text-sm text-rose-600">{redemptionsState.error}</p>
                ) : redemptionsState.loading && recentRedemptions.length === 0 ? (
                  <p className="text-sm text-gray-600">Loading recent redemptions.</p>
                ) : recentRedemptions.length === 0 ? (
                  <p className="text-sm text-gray-600">No vouchers redeemed yet.</p>
                ) : (
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="text-xs uppercase text-gray-500">
                        <tr>
                          <th className="py-2">Reward</th>
                          <th className="py-2">Participant</th>
                          <th className="py-2">Redeemed at</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {recentRedemptions.map((item) => (
                          <tr key={item.id}>
                            <td className="py-2 text-gray-800">{item.voucher_name ?? item.voucher_code}</td>
                            <td className="py-2 font-mono text-xs text-gray-600">{formatUserId(item.user_id)}</td>
                            <td className="py-2 text-gray-500">{formatDateTime(item.redeemed_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Organisation Leaderboard */}
      <Card className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2 text-gray-800">
            <Users className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-semibold">Organisation Leaderboard</h2>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <label className="text-sm text-gray-700 flex items-center gap-2">
              <span>Organisation</span>
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                disabled={!canInteract || availableOrgOptions.length === 0}
                className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 min-w-[12rem]"
              >
                {availableOrgOptions.length === 0 ? (
                  <option value="">No organisations</option>
                ) : (
                  availableOrgOptions.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
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
        ) : availableOrgOptions.length === 0 ? (
          <p className="text-sm text-gray-600">No organisations available yet.</p>
        ) : !selectedOrgId ? (
          <p className="text-sm text-gray-600">Select an organisation to see member standings.</p>
        ) : orgState.error ? (
          <p className="text-sm text-rose-600">{orgState.error}</p>
        ) : orgState.loading && orgRows.length === 0 ? (
          <p className="text-sm text-gray-600">Loading organisation leaderboard.</p>
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

      {/* Trail Attendance */}
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
                disabled={!canInteract || !selectedOrgIsMember || selectedOrgTrails.length === 0}
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
              disabled={
                !canInteract ||
                !selectedOrgId ||
                !selectedOrgIsMember ||
                !selectedTrailId ||
                attendanceState.loading
              }
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {!canInteract ? (
          <p className="text-sm text-gray-600">Sign in to view attendance.</p>
        ) : !selectedOrgId ? (
          <p className="text-sm text-gray-600">Select an organisation to view attendance.</p>
        ) : !selectedOrgIsMember ? (
          <p className="text-sm text-gray-600">Join the organisation to view detailed attendance.</p>
        ) : attendanceState.error ? (
          <p className="text-sm text-rose-600">{attendanceState.error}</p>
        ) : attendanceState.loading && attendanceRows.length === 0 ? (
          <p className="text-sm text-gray-600">Loading attendance.</p>
        ) : attendanceRows.length === 0 ? (
          <p className="text-sm text-gray-600">No attendance records for this trail yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase text-gray-500">
                <tr>
                  <th className="py-2">Participant</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Checked at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attendanceRows.map((entry) => (
                  <tr key={`${entry.user_id}-${entry.checked_at}`}>
                    <td className="py-2 font-mono text-sm text-gray-700">{formatUserId(entry.user_id)}</td>
                    <td className="py-2 text-gray-700">{entry.status ?? "checked_in"}</td>
                    <td className="py-2 text-gray-500">{formatDateTime(entry.checked_at)}</td>
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
