"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card } from "@silvertrails/ui";
import {
  Users,
  Activity,
  Target,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

import { useAuth } from "../context/AuthContext";
import { listTrails, type TrailStatus } from "../services/trails";
import {
  listOrganisations,
  listParticipants,
} from "../services/auth";
import { useOrganisation } from "../context/OrganisationContext";

type ActivitySummary = {
  id: string;
  title: string;
  startsAt: string;
  location: string | null;
  status: TrailStatus;
  capacity: number;
  orgName: string;
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

export default function DashboardPage() {
  const { tokens } = useAuth();
  const accessToken = tokens?.access_token ?? null;
  const { organisationId: selectedOrgId, activeOrganisation } = useOrganisation();

  const [stats, setStats] = useState(EMPTY_STATS);
  const [activities, setActivities] = useState<ActivitySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(
    async (signal?: AbortSignal) => {
      if (!accessToken) {
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

        const orgNameById = new Map<string, string>();
        organisations.forEach((org) => orgNameById.set(org.id, org.name));

        const relevantParticipants = selectedOrgId
          ? participants.filter((participant) =>
              Array.isArray(participant.org_ids) &&
              participant.org_ids.includes(selectedOrgId)
            )
          : participants;

        const summaries = [...trails]
          .sort(
            (a, b) =>
              new Date(b.starts_at).getTime() -
              new Date(a.starts_at).getTime()
          )
          .slice(0, 4)
          .map((trail) => ({
            id: trail.id,
            title: trail.title,
            startsAt: trail.starts_at,
            location: trail.location,
            status: trail.status,
            capacity: trail.capacity,
            orgName: orgNameById.get(trail.org_id) ?? "Organisation",
          }));
        setActivities(summaries);

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
    [accessToken, selectedOrgId]
  );

  useEffect(() => {
    if (!accessToken) {
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
                  No recent trails to display yet. Create a new trail or check back later.
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
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-gray-200 rounded-lg shadow-sm bg-white"
              >
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {activity.title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {formatDateTime(activity.startsAt)} ·{" "}
                    {describeLocation(activity.location)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {activity.orgName}
                  </p>
                </div>
                <div className="text-sm text-right">
                  <p className="text-gray-600">
                    Capacity {activity.capacity || "—"}
                  </p>
                  <span
                    className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium mt-1 ${activity.status === "published"
                        ? "bg-emerald-100 text-emerald-700"
                        : activity.status === "closed"
                          ? "bg-blue-100 text-blue-700"
                          : activity.status === "draft"
                            ? "bg-gray-100 text-gray-600"
                            : "bg-amber-100 text-amber-700"
                      }`}
                  >
                    {activity.status}
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
