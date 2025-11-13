"use client";

import { useCallback, useMemo, useState } from "react";
import { Button, Card } from "@silvertrails/ui";
import { Download, CheckCircle2, AlertTriangle } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useOrganisation } from "../../context/OrganisationContext";
import { listParticipants, type UserSummary } from "../../services/auth";
import { getOrgAttendanceSummary } from "../../services/leaderboard";
import { getOrgPointsSummary } from "../../services/points";
import { getTrailsOverview, listTrails } from "../../services/trails";
import { formatShortId } from "../../utils/participants";

type ReportId =
  | "participation"
  | "activity-summary"
  | "member-directory"
  | "monthly-summary";

type ReportDefinition = {
  id: ReportId;
  title: string;
  desc: string;
  accent: "teal" | "orange";
  format: "csv" | "xls";
};

const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    id: "participation",
    title: "Participation Report",
    desc: "Trail-level and day-by-day attendance over the last 30 days.",
    accent: "teal",
    format: "csv",
  },
  {
    id: "activity-summary",
    title: "Activity Summary",
    desc: "All trails with timings, capacity, and status.",
    accent: "teal",
    format: "csv",
  },
  {
    id: "member-directory",
    title: "Member Directory",
    desc: "Complete roster of participants in this organisation.",
    accent: "orange",
    format: "xls",
  },
  {
    id: "monthly-summary",
    title: "Monthly Report",
    desc: "Points and attendance KPIs for the last 30 days.",
    accent: "teal",
    format: "csv",
  },
];

type FeedbackState = { type: "success" | "error"; message: string } | null;

function escapeCsv(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return "";
  }
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function buildCsv(headers: string[], rows: Array<Array<string | number>>) {
  const headerLine = headers.map(escapeCsv).join(",");
  const rowLines = rows.map((row) => row.map(escapeCsv).join(","));
  return [headerLine, ...rowLines].join("\r\n");
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildExcelTable(headers: string[], rows: Array<Array<string>>) {
  const thead = `<thead><tr>${headers
    .map(
      (header) =>
        `<th style="text-align:left;border:1px solid #ccc;padding:4px;">${escapeHtml(
          header
        )}</th>`
    )
    .join("")}</tr></thead>`;
  const tbody = `<tbody>${rows
    .map(
      (row) =>
        `<tr>${row
          .map(
            (cell) =>
              `<td style="border:1px solid #eee;padding:4px;">${escapeHtml(
                cell
              )}</td>`
          )
          .join("")}</tr>`
    )
    .join("")}</tbody>`;
  return `<table>${thead}${tbody}</table>`;
}

function formatDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toISOString();
}

export default function ReportsPage() {
  const { tokens } = useAuth();
  const accessToken = tokens?.access_token ?? null;
  const {
    organisationId: selectedOrgId,
    activeOrganisation,
  } = useOrganisation();

  const [exporting, setExporting] = useState<ReportId | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [participantsCache, setParticipantsCache] = useState<
    UserSummary[] | null
  >(null);

  const canExport = Boolean(accessToken && selectedOrgId);
  const filenameOrgSegment = useMemo(() => {
    if (!selectedOrgId) {
      return "org";
    }
    return selectedOrgId.slice(0, 8).toUpperCase();
  }, [selectedOrgId]);

  const loadParticipants = useCallback(async () => {
    if (participantsCache) {
      return participantsCache;
    }
    if (!accessToken) {
      throw new Error("Sign in again to load participants.");
    }
    const list = await listParticipants({ accessToken });
    setParticipantsCache(list);
    return list;
  }, [participantsCache, accessToken]);

  const exportParticipation = useCallback(async () => {
    if (!accessToken || !selectedOrgId) {
      throw new Error("Select an organisation to export participation data.");
    }
    const [summary, trails] = await Promise.all([
      getOrgAttendanceSummary({
        accessToken,
        orgId: selectedOrgId,
        days: 30,
      }),
      listTrails({ accessToken, orgId: selectedOrgId }),
    ]);
    const trailNameById = new Map(trails.map((trail) => [trail.id, trail.title]));
    const perTrailCsv = buildCsv(
      ["Trail Name", "Trail ID", "Check-ins", "Unique Participants"],
      summary.per_trail.map((row) => [
        trailNameById.get(row.trail_id) ?? "—",
        row.trail_id,
        row.checkins,
        row.unique_participants,
      ])
    );
    const dailyCsv = buildCsv(
      ["Date", "Check-ins"],
      summary.daily.map((row) => [row.day, row.checkins])
    );
    const combined = [
      `Participation summary for ${filenameOrgSegment}`,
      perTrailCsv,
      "",
      "Daily Check-ins",
      dailyCsv,
    ].join("\r\n");
    const filename = `participation_report_${filenameOrgSegment}.csv`;
    downloadFile(combined, filename, "text/csv;charset=utf-8");
  }, [accessToken, selectedOrgId, filenameOrgSegment]);

  const exportActivitySummary = useCallback(async () => {
    if (!accessToken || !selectedOrgId) {
      throw new Error("Select an organisation to export activity data.");
    }
    const [overview, trails] = await Promise.all([
      getTrailsOverview({ accessToken, orgId: selectedOrgId }),
      listTrails({ accessToken, orgId: selectedOrgId }),
    ]);

    const csv = buildCsv(
      ["Trail Name", "Trail ID", "Status", "Starts At", "Ends At", "Capacity"],
      trails.map((trail) => [
        trail.title,
        trail.id,
        trail.status,
        trail.starts_at,
        trail.ends_at,
        trail.capacity,
      ])
    );

    const statsCsv = buildCsv(
      ["Metric", "Value"],
      [
        ["Total Trails", overview.total_trails],
        ["Published", overview.published],
        ["Closed", overview.closed],
        ["Cancelled", overview.cancelled],
        ["Total Capacity", overview.total_capacity],
        ["Confirmed Registrations", overview.confirmed_registrations],
      ]
    );

    const combined = [
      `Activity summary for ${filenameOrgSegment}`,
      csv,
      "",
      "Overview",
      statsCsv,
    ].join("\r\n");

    const filename = `activity_summary_${filenameOrgSegment}.csv`;
    downloadFile(combined, filename, "text/csv;charset=utf-8");
  }, [accessToken, selectedOrgId, filenameOrgSegment]);

  const exportMemberDirectory = useCallback(async () => {
    if (!accessToken || !selectedOrgId) {
      throw new Error("Select an organisation to export the member directory.");
    }
    const participants = await loadParticipants();
    const members = participants.filter((participant: UserSummary) =>
      Array.isArray(participant.org_ids)
        ? participant.org_ids.includes(selectedOrgId)
        : false
    );

    if (!members.length) {
      throw new Error("No members found for this organisation.");
    }

    const rows = members.map((participant) => [
      participant.name ?? "—",
      participant.nric ?? "—",
      formatShortId(participant.id),
      participant.id,
    ]);

    const table = buildExcelTable(
      ["Name", "NRIC", "Short ID", "User ID"],
      rows
    );
    const filename = `member_directory_${filenameOrgSegment}.xls`;
    downloadFile(
      table,
      filename,
      "application/vnd.ms-excel;charset=utf-8"
    );
  }, [accessToken, selectedOrgId, filenameOrgSegment, loadParticipants]);

  const exportMonthlySummary = useCallback(async () => {
    if (!accessToken || !selectedOrgId) {
      throw new Error("Select an organisation to export the monthly report.");
    }
    const dateTo = new Date();
    const dateFrom = new Date(dateTo);
    dateFrom.setDate(dateFrom.getDate() - 30);

    const [pointsSummary, attendanceSummary] = await Promise.all([
      getOrgPointsSummary({
        accessToken,
        orgId: selectedOrgId,
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
      }),
      getOrgAttendanceSummary({
        accessToken,
        orgId: selectedOrgId,
        days: 30,
      }),
    ]);

    let topEarnersRows: Array<Array<string | number>> = [];
    if (pointsSummary.top_earners.length > 0) {
      const participants = await loadParticipants();
      const participantMap = new Map(
        participants.map((participant) => [participant.id, participant])
      );
      topEarnersRows = pointsSummary.top_earners.map((earner) => {
        const profile = participantMap.get(earner.user_id);
        const name = profile?.name ?? formatShortId(earner.user_id);
        const nric = profile?.nric ?? "—";
        const shortId = formatShortId(earner.user_id);
        return [name, nric, shortId, earner.user_id, earner.total_awarded];
      });
    }

    const metricsCsv = buildCsv(
      ["Metric", "Value"],
      [
        ["Range Start", formatDate(pointsSummary.range_start)],
        ["Range End", formatDate(pointsSummary.range_end)],
        ["Points Awarded", pointsSummary.awarded_total],
        ["Points Redeemed", pointsSummary.redeemed_total],
        ["Net Points", pointsSummary.net_delta],
        ["Free Redemptions", pointsSummary.free_redemptions],
        ["Total Check-ins", attendanceSummary.total_checkins],
        ["Unique Participants", attendanceSummary.unique_participants],
      ]
    );

    const topEarnersSection =
      topEarnersRows.length > 0
        ? buildCsv(
            ["Name", "NRIC", "Short ID", "User ID", "Total Awarded"],
            topEarnersRows
          )
        : "No top earners data";

    const combined = [
      `Monthly summary for ${filenameOrgSegment}`,
      metricsCsv,
      "",
      "Top Earners",
      topEarnersSection,
    ].join("\r\n");

    const filename = `monthly_summary_${filenameOrgSegment}.csv`;
    downloadFile(combined, filename, "text/csv;charset=utf-8");
  }, [
    accessToken,
    selectedOrgId,
    filenameOrgSegment,
    loadParticipants,
  ]);

  const handleExport = useCallback(
    async (reportId: ReportId) => {
      if (!canExport) {
        setFeedback({
          type: "error",
          message: "Sign in and select an organisation to export reports.",
        });
        return;
      }
      setExporting(reportId);
      setFeedback(null);
      try {
        if (reportId === "participation") {
          await exportParticipation();
        } else if (reportId === "activity-summary") {
          await exportActivitySummary();
        } else if (reportId === "member-directory") {
          await exportMemberDirectory();
        } else if (reportId === "monthly-summary") {
          await exportMonthlySummary();
        }
        setFeedback({
          type: "success",
          message: "Report exported successfully.",
        });
      } catch (error) {
        setFeedback({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Unable to export report right now.",
        });
      } finally {
        setExporting(null);
      }
    },
    [
      canExport,
      exportParticipation,
      exportActivitySummary,
      exportMemberDirectory,
      exportMonthlySummary,
    ]
  );

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Export Reports</h3>
          <p className="text-sm text-gray-600">
            {activeOrganisation
              ? `Reports for ${activeOrganisation.name}`
              : "Select an organisation from the header to export reports."}
          </p>
        </div>
        {feedback ? (
          <div
            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <span>{feedback.message}</span>
          </div>
        ) : null}
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {REPORT_DEFINITIONS.map((report) => {
          const isExporting = exporting === report.id;
          return (
            <Card
              key={report.id}
              className="border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col gap-3"
            >
              <h4 className="font-semibold text-gray-800">{report.title}</h4>
              <p className="text-sm text-gray-600">{report.desc}</p>
              <Button
                onClick={() => void handleExport(report.id)}
                disabled={isExporting || !canExport}
                className={`w-full flex items-center justify-center gap-2 ${
                  report.accent === "orange"
                    ? "bg-orange-500 hover:bg-orange-600"
                    : "bg-teal-500 hover:bg-teal-600"
                }`}
              >
                {isExporting ? (
                  "Preparing..."
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    {report.format === "xls"
                      ? "Download Excel"
                      : "Download CSV"}
                  </>
                )}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
