"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  FormEvent,
} from "react";
import { Button, Card, SectionTitle } from "@silvertrails/ui";
import { Loader2, RefreshCw } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useOrganisation } from "../../context/OrganisationContext";
import { listParticipants, type UserSummary } from "../../services/auth";
import {
  listOrgBalances,
  listOrgLedger,
  adjustPoints,
  type OrgBalance,
  type OrgLedgerEntry,
} from "../../services/points";
import { resolveParticipantIdentity } from "../../utils/participants";
import { OrganisationRequiredCard } from "../../components/OrganisationRequiredCard";

type AlertState = { type: "success" | "error"; message: string } | null;

type AdjustFormState = {
  identifier: string;
  delta: string;
  reason: string;
};

export default function PointsPage() {
  const { tokens, user } = useAuth();
  const accessToken = tokens?.access_token ?? null;
  const organiserOrgIds = user?.org_ids ?? [];
  const {
    organisationId: selectedOrgId,
    activeOrganisation,
    refreshOrganisations,
  } = useOrganisation();

  const [participants, setParticipants] = useState<UserSummary[]>([]);
  const [balances, setBalances] = useState<OrgBalance[]>([]);
  const [ledger, setLedger] = useState<OrgLedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<AlertState>(null);

  const [formState, setFormState] = useState<AdjustFormState>({
    identifier: "",
    delta: "50",
    reason: "",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    const controller = new AbortController();
    listParticipants({ accessToken, signal: controller.signal })
      .then((list) => setParticipants(list))
      .catch(() => {});
    void refreshOrganisations();
    return () => controller.abort();
  }, [accessToken, refreshOrganisations]);

  const fetchPoints = useCallback(async () => {
    if (!accessToken || !selectedOrgId) {
      setBalances([]);
      setLedger([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [balancesPage, ledgerPage] = await Promise.all([
        listOrgBalances({
          accessToken,
          orgId: selectedOrgId,
          limit: 10,
        }),
        listOrgLedger({
          accessToken,
          orgId: selectedOrgId,
          limit: 10,
        }),
      ]);
      setBalances(balancesPage.items);
      setLedger(ledgerPage.items);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load points for this organisation."
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, selectedOrgId]);

  useEffect(() => {
    void fetchPoints();
  }, [fetchPoints]);

  const participantDirectory = useMemo(() => {
    const map = new Map<string, UserSummary>();
    participants.forEach((participant) => map.set(participant.id, participant));
    return map;
  }, [participants]);

  const participantIdentityOf = useCallback(
    (userId: string) => resolveParticipantIdentity(participantDirectory.get(userId), userId),
    [participantDirectory]
  );

  const handleAdjust = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (!accessToken || !selectedOrgId) {
        return;
      }
      const identifier = formState.identifier.trim();
      const delta = Number(formState.delta);
      if (!identifier || !Number.isFinite(delta) || delta === 0) {
        setAlert({
          type: "error",
          message: "Provide a participant identifier and non-zero point change.",
        });
        return;
      }
      setFormSubmitting(true);
      setAlert(null);
      try {
        await adjustPoints({
          accessToken,
          orgId: selectedOrgId,
          payload: {
            identifier,
            delta,
            reason: formState.reason.trim() || "manual_adjustment",
          },
        });
        setAlert({
          type: "success",
          message: "Points updated successfully.",
        });
        setFormState((prev) => ({ ...prev, delta: "50", reason: "" }));
        await fetchPoints();
      } catch (err) {
        setAlert({
          type: "error",
          message:
            err instanceof Error
              ? err.message
              : "Unable to adjust points right now.",
        });
      } finally {
        setFormSubmitting(false);
      }
    },
    [accessToken, selectedOrgId, formState, fetchPoints]
  );

  if (!accessToken) {
    return (
      <div className="p-4">
        <Card className="p-6 text-center text-gray-600">
          Sign in again to manage points.
        </Card>
      </div>
    );
  }

  if (organiserOrgIds.length === 0) {
    return <OrganisationRequiredCard />;
  }

  const selectedOrgName =
    activeOrganisation?.name ||
    (selectedOrgId ? selectedOrgId.slice(0, 8).toUpperCase() : "N/A");

  const totalPoints = balances.reduce((sum, entry) => sum + entry.balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Points overview
          </h1>
          <p className="text-sm text-gray-600">
            Monitor balances and record manual adjustments.
          </p>
        </div>
        <div className="flex flex-col sm:items-end gap-2">
          <p className="text-sm text-gray-600">
            {activeOrganisation
              ? `Organisation: ${activeOrganisation.name}`
              : "Select an organisation from the header to view balances."}
          </p>
          <Button
            variant="ghost"
            className="flex items-center gap-2 self-start sm:self-auto"
            onClick={() => void fetchPoints()}
            disabled={loading || !selectedOrgId}
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {alert ? (
        <Card
          className={`p-4 text-sm ${
            alert.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {alert.message}
        </Card>
      ) : null}

      <Card className="p-5 space-y-4">
  <SectionTitle title={`Manual adjustment (${selectedOrgName})`} subtitle="" />
        <form
          onSubmit={handleAdjust}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <label className="flex flex-col text-sm text-gray-600">
            Participant ID / NRIC
            <input
              type="text"
              value={formState.identifier}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  identifier: event.target.value,
                }))
              }
              className="mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
            />
          </label>
          <label className="flex flex-col text-sm text-gray-600">
            Points delta
            <input
              type="number"
              value={formState.delta}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, delta: event.target.value }))
              }
              className="mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
            />
          </label>
          <label className="flex flex-col text-sm text-gray-600 md:col-span-2">
            Reason (optional)
            <input
              type="text"
              value={formState.reason}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  reason: event.target.value,
                }))
              }
              className="mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
              placeholder="E.g. Volunteer bonus"
            />
          </label>
          <div className="md:col-span-4 flex justify-end">
            <Button type="submit" disabled={formSubmitting}>
              {formSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating…
                </span>
              ) : (
                "Apply change"
              )}
            </Button>
          </div>
        </form>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <SectionTitle title="Balances (latest 10)" subtitle="" />
          <p className="text-sm text-gray-600">
            Total points tracked:{" "}
            <span className="font-semibold">{totalPoints.toLocaleString()}</span>
          </p>
          {loading && balances.length === 0 ? (
            <p className="text-sm text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />
              Loading balances…
            </p>
          ) : balances.length === 0 ? (
            <p className="text-sm text-gray-600">No balances found yet.</p>
          ) : (
            <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">
                    Participant
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody>
                {balances.map((entry) => {
                  const identity = participantIdentityOf(entry.user_id);
                  return (
                    <tr key={entry.user_id} className="border-t">
                      <td className="px-3 py-2 text-gray-700">
                        <div className="font-semibold text-gray-900">{identity.name}</div>
                        {identity.nric ? (
                          <div className="text-xs text-gray-500">{identity.nric}</div>
                        ) : null}
                        <div className="text-[11px] font-mono text-gray-400">{identity.shortId}</div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-gray-900">
                        {entry.balance.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
        <Card className="p-4 space-y-3">
          <SectionTitle title="Recent ledger entries" subtitle="" />
          {loading && ledger.length === 0 ? (
            <p className="text-sm text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />
              Loading ledger…
            </p>
          ) : ledger.length === 0 ? (
            <p className="text-sm text-gray-600">No ledger entries yet.</p>
          ) : (
            <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">
                    Participant
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">
                    Reason
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">
                    Delta
                  </th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((entry) => {
                  const identity = participantIdentityOf(entry.user_id);
                  return (
                    <tr key={entry.id} className="border-t">
                      <td className="px-3 py-2 text-gray-700">
                        <div className="font-semibold text-gray-900">{identity.name}</div>
                        {identity.nric ? (
                          <div className="text-xs text-gray-500">{identity.nric}</div>
                        ) : null}
                        <div className="text-[11px] font-mono text-gray-400">{identity.shortId}</div>
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        {entry.reason}
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-mono ${
                          entry.delta >= 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {entry.delta >= 0 ? "+" : ""}
                        {entry.delta}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {error ? (
        <Card className="p-4 border border-rose-200 bg-rose-50 text-rose-700">
          {error}
        </Card>
      ) : null}
    </div>
  );
}
