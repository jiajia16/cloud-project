"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card } from "@silvertrails/ui";
import { Loader2, RefreshCw } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import {
    assignParticipantToOrganisation,
    listOrganisations,
    listParticipants,
    type OrganisationSummary,
    type UserSummary,
} from "../../services/auth";

type AlertState = { type: "success" | "error"; message: string } | null;

function getErrorMessage(err: unknown) {
    if (err instanceof Error) {
        return err.message;
    }
    return "Something went wrong.";
}

export default function ParticipantsPage() {
    const { tokens, user } = useAuth();
    const accessToken = tokens?.access_token ?? null;
    const organiserOrgIds = user?.org_ids ?? [];

    const [participants, setParticipants] = useState<UserSummary[]>([]);
    const [organisations, setOrganisations] = useState<OrganisationSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [alert, setAlert] = useState<AlertState>(null);
    const [assigning, setAssigning] = useState<Record<string, boolean>>({});
    const [orgSelection, setOrgSelection] = useState<Record<string, string>>({});

    const orgNameById = useMemo(() => {
        const map = new Map<string, string>();
        organisations.forEach((org) => {
            map.set(org.id, org.name);
        });
        return map;
    }, [organisations]);

    const hydrateSelections = useCallback(
        (users: UserSummary[], orgs: OrganisationSummary[]) => {
            setOrgSelection(() => {
                const next: Record<string, string> = {};
                users.forEach((participant) => {
                    const available = orgs.find((org) => !participant.org_ids.includes(org.id));
                    next[participant.id] = available?.id ?? "";
                });
                return next;
            });
        },
    []);

    const loadData = useCallback(async () => {
        if (!accessToken) {
            return;
        }
        setLoading(true);
        setError(null);
        setAlert(null);
        try {
            const [fetchedParticipants, fetchedOrganisations] = await Promise.all([
                listParticipants({ accessToken }),
                listOrganisations({ accessToken }),
            ]);
            setParticipants(fetchedParticipants);
            setOrganisations(fetchedOrganisations);
            hydrateSelections(fetchedParticipants, fetchedOrganisations);
        } catch (err) {
            setError(getErrorMessage(err));
            setParticipants([]);
            setOrganisations([]);
        } finally {
            setLoading(false);
        }
    }, [accessToken, hydrateSelections]);

    useEffect(() => {
        if (!accessToken) {
            setParticipants([]);
            setOrganisations([]);
            setError("Sign in to manage participants.");
            return;
        }
        setError(null);
        void loadData();
    }, [accessToken, loadData]);

    const handleAssign = useCallback(
        async (participantId: string) => {
            if (!accessToken) {
                setAlert({ type: "error", message: "Missing organiser session." });
                return;
            }
            const participant = participants.find((entry) => entry.id === participantId);
            if (!participant) {
                setAlert({ type: "error", message: "Participant record not found." });
                return;
            }
            const targetOrgId = orgSelection[participantId];
            if (!targetOrgId) {
                setAlert({ type: "error", message: "Choose an organisation first." });
                return;
            }
            if (participant.org_ids.includes(targetOrgId)) {
                setAlert({ type: "error", message: "Participant already belongs to that organisation." });
                return;
            }

            setAssigning((state) => ({ ...state, [participantId]: true }));
            setAlert(null);
            try {
                await assignParticipantToOrganisation({
                    accessToken,
                    orgId: targetOrgId,
                    userId: participantId,
                });
                setParticipants((state) =>
                    state.map((entry) => {
                        if (entry.id !== participantId) {
                            return entry;
                        }
                        if (entry.org_ids.includes(targetOrgId)) {
                            return entry;
                        }
                        return { ...entry, org_ids: [...entry.org_ids, targetOrgId] };
                    })
                );
                setAlert({
                    type: "success",
                    message: `${participant.name} is now assigned to ${orgNameById.get(targetOrgId) ?? targetOrgId}.`,
                });
                setOrgSelection((state) => {
                    const next = { ...state };
                    const existingOrgIds = participants.find(
                        (entry) => entry.id === participantId
                    )?.org_ids ?? [];
                    const updated = new Set([...existingOrgIds, targetOrgId]);
                    const fallback = organisations.find((org) => !updated.has(org.id))?.id ?? "";
                    next[participantId] = fallback;
                    return next;
                });
            } catch (err) {
                setAlert({ type: "error", message: getErrorMessage(err) });
            } finally {
                setAssigning((state) => ({ ...state, [participantId]: false }));
            }
        },
        [accessToken, participants, orgSelection, organisations, orgNameById]
    );

    const refreshableOrganisations = useMemo(() => {
        if (!organisations.length) {
            return "No organisations available.";
        }
        const count = organiserOrgIds.length;
        if (count > 0) {
            return `You belong to ${count} organisation${count > 1 ? "s" : ""}.`;
        }
        return "You are not currently assigned to any organisation.";
    }, [organisations, organiserOrgIds]);

    return (
        <Card className="space-y-4 border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-gray-800">Participant Management</h3>
                <Button
                    variant="ghost"
                    className="border border-gray-200 px-3 py-1 text-xs"
                    onClick={() => void loadData()}
                    disabled={loading || !accessToken}
                >
                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    <span className="ml-1">Refresh</span>
                </Button>
            </div>

            {alert ? (
                <div
                    className={`rounded-md border px-3 py-2 text-sm ${
                        alert.type === "success"
                            ? "border-teal-200 bg-teal-50 text-teal-700"
                            : "border-rose-200 bg-rose-50 text-rose-600"
                    }`}
                >
                    {alert.message}
                </div>
            ) : null}

            {error ? (
                <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                    {error}
                </div>
            ) : null}

            <p className="text-xs text-gray-500">{refreshableOrganisations}</p>

            {loading ? (
                <div className="flex justify-center py-12 text-teal-600">
                    <Loader2 className="h-5 w-5 animate-spin" />
                </div>
            ) : participants.length === 0 ? (
                <p className="text-sm text-gray-500">No senior participants found.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50 text-left text-gray-600">
                            <tr>
                                <th className="px-3 py-2 font-medium">Participant</th>
                                <th className="px-3 py-2 font-medium">Organisations</th>
                                <th className="px-3 py-2 font-medium">Assign to organisation</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {participants.map((participant) => {
                                const selection = orgSelection[participant.id] ?? "";
                                const assigningRow = assigning[participant.id] ?? false;
                                const availableOrgs = organisations.filter(
                                    (org) => !participant.org_ids.includes(org.id)
                                );
                                return (
                                    <tr key={participant.id} className="align-top">
                                        <td className="px-3 py-3 text-gray-800">
                                            <div className="font-semibold">{participant.name}</div>
                                            <div className="text-xs text-gray-500">{participant.nric}</div>
                                        </td>
                                        <td className="px-3 py-3">
                                            {participant.org_ids.length === 0 ? (
                                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                                                    Not assigned
                                                </span>
                                            ) : (
                                                <div className="flex flex-wrap gap-2">
                                                    {participant.org_ids.map((orgId) => (
                                                        <span
                                                            key={orgId}
                                                            className="rounded-full bg-teal-50 px-3 py-1 text-xs text-teal-700"
                                                        >
                                                            {orgNameById.get(orgId) ?? orgId}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <select
                                                    className="min-w-[180px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                                                    value={selection}
                                                    onChange={(event) =>
                                                        setOrgSelection((state) => ({
                                                            ...state,
                                                            [participant.id]: event.target.value,
                                                        }))
                                                    }
                                                    disabled={assigningRow || organisations.length === 0}
                                                >
                                                    <option value="">
                                                        {availableOrgs.length === 0
                                                            ? "All assigned"
                                                            : "Select organisation"}
                                                    </option>
                                                    {organisations.map((org) => (
                                                        <option
                                                            key={org.id}
                                                            value={org.id}
                                                            disabled={participant.org_ids.includes(org.id)}
                                                        >
                                                            {org.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <Button
                                                    type="button"
                                                    className="px-4 py-2 text-sm"
                                                    onClick={() => void handleAssign(participant.id)}
                                                    disabled={
                                                        assigningRow ||
                                                        !selection ||
                                                        participant.org_ids.includes(selection)
                                                    }
                                                >
                                                    {assigningRow ? "Assigning..." : "Assign"}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    );
}
