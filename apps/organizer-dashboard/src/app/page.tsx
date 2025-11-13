"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@silvertrails/ui";
import {
  Users,
  Activity,
  Target,
  CheckCircle,
  RefreshCw,
  ClipboardList,
  UserCheck,
  Gift,
} from "lucide-react";
import Link from "next/link";

import { useAuth } from "../context/AuthContext";
import {
  getTrailRegistrations,
  listTrails,
  type TrailStatus,
  type Registration,
} from "../services/trails";
import {
  listOrganisations,
  listParticipants,
  type UserSummary,
} from "../services/auth";
import { listVouchers, type Voucher } from "../services/points";
import { useOrganisation } from "../context/OrganisationContext";
import { formatShortId } from "../utils/participants";
import { OrganisationRequiredCard } from "../components/OrganisationRequiredCard";

type DashboardActivityType = "trail" | "approval" | "reward";

type DashboardActivity = {
  id: string;
  type: DashboardActivityType;
  title: string;
  description: string;
  timestamp: string;
  orgName: string;
  badge: string;
  badgeClass: string;
};

const TRAIL_STATUS_LABEL: Record<TrailStatus, string> = {
  draft: "Draft",
  published: "Published",
  closed: "Closed",
  cancelled: "Cancelled",
};

const TRAIL_STATUS_BADGE: Record<TrailStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  published: "bg-emerald-100 text-emerald-700",
  closed: "bg-blue-100 text-blue-700",
  cancelled: "bg-rose-100 text-rose-700",
};

const EMPTY_STATS = {
  totalParticipants: 0,
  activeParticipants: 0,
  totalActivities: 0,
  completionRate: 0,
};

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-SG", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Singapore",
});

const NUMBER_FORMATTER = new Intl.NumberFormat("en-SG");

function formatDateTime(value: string) {
  try {
    return DATE_TIME_FORMATTER.format(new Date(value));
  } catch {
    return value;
  }
}

function formatCount(value: number) {
  try {
    return NUMBER_FORMATTER.format(value);
  } catch {
    return String(value);
  }
}

function describeLocation(value: string | null) {
  if (!value) {
    return "Location TBC";
  }
  return value;
}

function describeParticipantForFeed(
  profile: UserSummary | undefined,
  fallbackUserId: string
) {
  const shortId = formatShortId(fallbackUserId);
  if (!profile) {
    return shortId;
  }
  const name = profile.name?.trim() || shortId;
  const nric = profile.nric?.trim() || null;
  return [name, nric, shortId].filter(Boolean).join(" · ");
}

export default function DashboardPage() {
  const { tokens, user } = useAuth();
  const accessToken = tokens?.access_token ?? null;
  const organiserOrgIds = user?.org_ids ?? [];
  const { organisationId: selectedOrgId, activeOrganisation } = useOrganisation();

  const [stats, setStats] = useState(EMPTY_STATS);
  const [activities, setActivities] = useState<DashboardActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasOrganisation = organiserOrgIds.length > 0;
  const canViewOrgData = hasOrganisation && Boolean(selectedOrgId);

  const fetchDashboard = useCallback(
    async (signal?: AbortSignal) => {
      if (!accessToken || !canViewOrgData) {
        setStats(EMPTY_STATS);
        setActivities([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [trails, organisations, participants] = await Promise.all([
          listTrails({ accessToken, orgId: selectedOrgId ?? undefined, signal }),
          listOrganisations({ accessToken, signal }),
          listParticipants({ accessToken, signal }),
        ]);

        if (signal?.aborted) {
          return;
        }

        const orgNameById = new Map<string, string>();
        organisations.forEach((org) => orgNameById.set(org.id, org.name));

        const participantsById = new Map<string, UserSummary>();
        participants.forEach((participant) => {
          participantsById.set(participant.id, participant);
        });

        const trailsById = new Map<string, (typeof trails)[number]>();
        trails.forEach((trail) => trailsById.set(trail.id, trail));

        const relevantParticipants = participants.filter(
          (participant) =>
            Array.isArray(participant.org_ids) &&
            participant.org_ids.includes(selectedOrgId as string)
        );

        const scopedTrails = trails.filter(
          (trail) => trail.org_id === selectedOrgId
        );

        const sortTrailRecency = (trail: (typeof trails)[number]) =>
          new Date(
            trail.updated_at ?? trail.created_at ?? trail.starts_at
          ).getTime();

        const recentTrails = [...scopedTrails].sort(
          (a, b) => sortTrailRecency(b) - sortTrailRecency(a)
        );

        const trailsForApprovals = recentTrails.slice(0, 3);
        let registrationFeed: Registration[] = [];
        if (trailsForApprovals.length > 0) {
          const pages = await Promise.all(
            trailsForApprovals.map((trail) =>
              getTrailRegistrations({
                accessToken,
                trailId: trail.id,
                limit: 10,
                sort: "updated",
                direction: "desc",
                signal,
              }).catch(() => null)
            )
          );
          if (signal?.aborted) {
            return;
          }
          registrationFeed = pages.flatMap((page) => page?.items ?? []);
        }

        const rewardOrgId = selectedOrgId;

        let vouchers: Voucher[] = [];
        if (rewardOrgId) {
          try {
            vouchers = await listVouchers({
              accessToken,
              orgId: rewardOrgId,
              signal,
            });
          } catch {
            if (signal?.aborted) {
              return;
            }
            vouchers = [];
          }
        }

        const resolveOrgName = (orgId: string | undefined | null) => {
          if (!orgId) {
            return "Organisation";
          }
          return orgNameById.get(orgId) ?? orgId.slice(0, 8).toUpperCase();
        };

        const nowIso = new Date().toISOString();

        const trailEvents: DashboardActivity[] = recentTrails
          .slice(0, 4)
          .map((trail) => {
            const timestamp =
              trail.updated_at ??
              trail.created_at ??
              trail.starts_at ??
              nowIso;
            return {
              id: `trail-${trail.id}`,
              type: "trail",
              title: trail.title,
              description: `${formatDateTime(trail.starts_at)} · ${describeLocation(trail.location)} · Capacity ${trail.capacity || "—"}`,
              timestamp,
              orgName: resolveOrgName(trail.org_id),
              badge: TRAIL_STATUS_LABEL[trail.status],
              badgeClass: TRAIL_STATUS_BADGE[trail.status],
            };
          });

        const approvalStatuses = new Set<Registration["status"]>([
          "approved",
          "confirmed",
        ]);
        const approvalEvents: DashboardActivity[] = registrationFeed
          .filter((registration) => approvalStatuses.has(registration.status))
          .sort((a, b) => {
            const aTime = new Date(
              a.updated_at ?? a.created_at ?? nowIso
            ).getTime();
            const bTime = new Date(
              b.updated_at ?? b.created_at ?? nowIso
            ).getTime();
            return bTime - aTime;
          })
          .map((registration) => {
            const trail = registration.trail_id
              ? trailsById.get(registration.trail_id)
              : undefined;
            const participantProfile = participantsById.get(
              registration.user_id
            );
            const actionLabel =
              registration.status === "approved"
                ? "Registration approved"
                : "Attendance confirmed";
            const badgeClass =
              registration.status === "approved"
                ? "bg-indigo-100 text-indigo-700"
                : "bg-emerald-100 text-emerald-700";
            const timestamp =
              registration.updated_at ??
              registration.created_at ??
              nowIso;
            return {
              id: `registration-${registration.id}-${registration.status}`,
              type: "approval",
              title: trail
                ? `${actionLabel} · ${trail.title}`
                : actionLabel,
              description: describeParticipantForFeed(
                participantProfile,
                registration.user_id
              ),
              timestamp,
              orgName: resolveOrgName(trail?.org_id ?? rewardOrgId),
              badge: registration.status === "approved" ? "Approved" : "Confirmed",
              badgeClass,
            };
          })
          .slice(0, 6);

        const rewardEvents: DashboardActivity[] = [...vouchers]
          .sort((a, b) => {
            const aTime = new Date(
              a.updated_at ?? a.created_at ?? nowIso
            ).getTime();
            const bTime = new Date(
              b.updated_at ?? b.created_at ?? nowIso
            ).getTime();
            return bTime - aTime;
          })
          .slice(0, 4)
          .map((voucher) => {
            const timestamp =
              voucher.updated_at ?? voucher.created_at ?? nowIso;
            const isUpdated =
              voucher.updated_at &&
              voucher.created_at &&
              voucher.updated_at !== voucher.created_at;
            const badge = isUpdated
              ? "Reward updated"
              : "Reward created";
            const badgeClass = isUpdated
              ? "bg-amber-100 text-amber-700"
              : "bg-fuchsia-100 text-fuchsia-700";
            const statusLabel =
              voucher.status === "active" ? "Active" : "Disabled";
            const pointsLabel = `${voucher.points_cost.toLocaleString(
              "en-SG"
            )} pts`;
            const quantityLabel =
              voucher.total_quantity === null
                ? "Unlimited quantity"
                : `${Math.max(
                    voucher.total_quantity - voucher.redeemed_count,
                    0
                  )} remaining`;
            return {
              id: `voucher-${voucher.id}`,
              type: "reward",
              title: voucher.name,
              description: `${statusLabel} · ${pointsLabel} · ${quantityLabel} · Code ${voucher.code}`,
              timestamp,
              orgName: resolveOrgName(voucher.org_id),
              badge,
              badgeClass,
            };
          });

        const combinedActivities = [...trailEvents, ...approvalEvents, ...rewardEvents]
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() -
              new Date(a.timestamp).getTime()
          )
          .slice(0, 8);
        setActivities(combinedActivities);

        const totalParticipants = relevantParticipants.length;
        const activeParticipants = relevantParticipants.filter(
          (participant) =>
            Array.isArray(participant.org_ids) &&
            participant.org_ids.length > 0
        ).length;
        const totalActivities = trails.length;
        const completed = trails.filter(
          (trail) => trail.status === "closed"
        ).length;
        const trackable = trails.filter((trail) =>
          ["published", "closed"].includes(trail.status)
        ).length;
        const completionRate =
          trackable > 0 ? Math.round((completed / trackable) * 100) : 0;

        setStats({
          totalParticipants,
          activeParticipants,
          totalActivities,
          completionRate,
        });
      } catch (err) {
        if (signal?.aborted) {
          return;
        }
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load dashboard data."
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [accessToken, canViewOrgData, selectedOrgId]
  );

  useEffect(() => {
    if (!accessToken || !canViewOrgData) {
      setStats(EMPTY_STATS);
      setActivities([]);
      return;
    }
    const controller = new AbortController();
    void fetchDashboard(controller.signal);
    return () => controller.abort();
  }, [accessToken, fetchDashboard]);

  const statCards = [
    {
      label: "Total Participants",
      value: formatCount(stats.totalParticipants),
      description: "Across organisations you manage",
      icon: <Users className="w-6 h-6 text-teal-500 mx-auto" />,
    },
    {
      label: "Active Participants",
      value: formatCount(stats.activeParticipants),
      description: "Assigned to at least one organisation",
      icon: <Activity className="w-6 h-6 text-teal-500 mx-auto" />,
    },
    {
      label: "Total Activities",
      value: formatCount(stats.totalActivities),
      description: "Draft, published, and closed trails",
      icon: <Target className="w-6 h-6 text-teal-500 mx-auto" />,
    },
    {
      label: "Completion Rate",
      value: `${stats.completionRate}%`,
      description: "Closed vs. published activities",
      icon: <CheckCircle className="w-6 h-6 text-teal-500 mx-auto" />,
    },
  ];

  const activityIconByType: Record<DashboardActivityType, JSX.Element> = {
    trail: <ClipboardList className="w-4 h-4" />,
    approval: <UserCheck className="w-4 h-4" />,
    reward: <Gift className="w-4 h-4" />,
  };

  const activityIconTone: Record<DashboardActivityType, string> = {
    trail: "bg-teal-50 text-teal-600",
    approval: "bg-indigo-50 text-indigo-600",
    reward: "bg-amber-50 text-amber-600",
  };

  if (!hasOrganisation) {
    return <OrganisationRequiredCard />;
  }

  return (
    <div className="space-y-8">
      <section>
        {selectedOrgId ? (
          <p className="mb-3 text-sm text-gray-600">
            Showing metrics for {activeOrganisation?.name ?? selectedOrgId.slice(0, 8).toUpperCase()}.
          </p>
        ) : null}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card
              key={stat.label}
              className="p-4 text-center border border-gray-200 shadow-sm rounded-lg bg-white"
            >
              <div className="flex justify-center mb-2">{stat.icon}</div>
              <h3 className="text-sm font-semibold mt-2 text-gray-700">
                {stat.label}
              </h3>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? "…" : stat.value}
              </p>
              <p className="text-xs text-gray-500">{stat.description}</p>
            </Card>
          ))}
        </div>
        {error ? (
          <p className="mt-3 text-sm text-rose-600">{error}</p>
        ) : null}
      </section>

      <section>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent activities
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => void fetchDashboard()}
            disabled={loading || !accessToken}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
        <div className="space-y-3">
          {loading && activities.length === 0 ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <Card
                key={`skeleton-${idx}`}
                className="p-4 border border-gray-200 rounded-lg shadow-sm bg-white animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </Card>
            ))
          ) : activities.length === 0 ? (
            <Card className="p-4 border border-gray-200 bg-white">
              <div className="flex items-center justify-between rounded-md border border-gray-200 bg-white p-4">
                <p className="text-sm text-gray-600">
                  No organiser activity to display yet. Create a new trail, approve registrations, or edit rewards to see updates here.
                </p>
                <Button
                  type="button"
                  className="ml-4 shrink-0 rounded-full bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600"
                >
                  <Link href="/manageTrails">Create trail</Link>
                </Button>
              </div>
            </Card>
          ) : (
            activities.map((activity) => (
              <Card
                key={activity.id}
                className="p-4 border border-gray-200 rounded-lg shadow-sm bg-white"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`rounded-full p-2 ${activityIconTone[activity.type]}`}
                    >
                      {activityIconByType[activity.type]}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {activity.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.orgName}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-right">
                    <span
                      className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium ${activity.badgeClass}`}
                    >
                      {activity.badge}
                    </span>
                    <p className="text-xs text-gray-500 mt-2">
                      {formatDateTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
