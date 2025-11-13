"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Card, Button } from "@silvertrails/ui";
import {
    Activity,
    CalendarClock,
    Copy,
    Download,
    Edit3,
    Loader2,
    Plus,
    QrCode,
    RefreshCw,
    Users,
} from "lucide-react";
import QRCode from "qrcode";
import { useAuth } from "../../context/AuthContext";
import { useOrganisation } from "../../context/OrganisationContext";
import { listParticipants, resolveParticipantUserId, type UserSummary } from "../../services/auth";
import { formatParticipantIdentity, resolveParticipantIdentity } from "../../utils/participants";
import { OrganisationRequiredCard } from "../../components/OrganisationRequiredCard";
import {
    acceptInvite,
    approveRegistration,
    cancelRegistration,
    confirmRegistration,
    createRegistrationForTrail,
    createTrail,
    createTrailActivity,
    createTrailInvite,
    getRegistrationStatus,
    getTrail,
    getTrailRegistrations,
    deleteTrailActivity,
    listMyOrganiserTrails,
    listTrails,
    listTrailActivities,
    previewInvite,
    rejectRegistration,
    Trail,
    TrailStatus,
    updateTrail,
    updateTrailActivity,
    type InviteToken,
    type Registration,
    type CreateTrailPayload,
    type UpdateTrailPayload,
} from "../../services/trails";
import {
    createActivityQr,
    createTrailQr,
    getTrailRoster,
    getTrailQrImage,
    type Checkin,
    type TrailQrToken,
} from "../../services/checkins";

type AlertState = { type: "success" | "error"; message: string } | null;

// Local activity model for organiser-defined sequential activities within a trail
type TrailActivity = {
    id: string;
    order: number;
    title: string;
    points: number;
    notes?: string;
    qrToken?: TrailQrToken | null;
    qrShareUrl?: string | null;
    // Object URL created from PNG blob; not persisted
    qrImageUrl?: string | null;
    // UI-only state: whether this item is being edited
    isEditing?: boolean;
    // Whether the activity has been persisted to the backend
    persisted?: boolean;
};

function makeId() {
    try {
        // @ts-ignore - crypto may exist in browser
        if (typeof crypto !== "undefined" && (crypto as any).randomUUID) {
            return (crypto as any).randomUUID();
        }
    } catch { }
    return (
        Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
    ).toUpperCase();
}

function disposeObjectUrl(url: string | null | undefined) {
    if (url && url.startsWith("blob:")) {
        try {
            disposeObjectUrl(url);
        } catch { }
    }
}

function appendQuery(url: string, params: Record<string, string | number | undefined>) {
    try {
        const absolute = new URL(url, typeof window !== "undefined" ? window.location.origin : undefined);
        Object.entries(params).forEach(([k, v]) => {
            if (v === undefined || v === null || v === "") return;
            absolute.searchParams.set(k, String(v));
        });
        return absolute.toString();
    } catch {
        return url;
    }
}

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

function describeLocation(value: string | null | undefined) {
    if (!value) {
        return "Location TBC";
    }
    const trimmed = value.trim();
    return trimmed.length ? trimmed : "Location TBC";
}

const REGISTRATION_STATUS_LABEL: Record<Registration["status"], string> = {
    pending: "Pending",
    approved: "Approved",
    confirmed: "Confirmed",
    rejected: "Rejected",
    cancelled: "Cancelled",
    waitlisted: "Waitlisted",
};

const REGISTRATIONS_PAGE_SIZE = 25;

function formatDate(value: string | null | undefined) {
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

function getErrorMessage(err: unknown) {
    if (err instanceof Error) {
        return err.message;
    }
    return "Something went wrong.";
}

type TrailFormProps = {
    initial?: Partial<CreateTrailPayload & { status: TrailStatus }>;
    submitting: boolean;
    onSubmit: (payload: CreateTrailPayload | UpdateTrailPayload) => Promise<void>;
    onCancel: () => void;
    submitLabel: string;
};

function TrailForm({ initial, submitting, submitLabel, onSubmit, onCancel }: TrailFormProps) {
    const [title, setTitle] = useState(initial?.title ?? "");
    const [description, setDescription] = useState(initial?.description ?? "");
    const [location, setLocation] = useState(initial?.location ?? "");
    const [capacity, setCapacity] = useState<string>(
        initial?.capacity !== undefined ? String(initial.capacity) : ""
    );
    const [startsAt, setStartsAt] = useState(() => {
        if (!initial?.starts_at) {
            return "";
        }
        const date = new Date(initial.starts_at);
        if (Number.isNaN(date.getTime())) {
            return "";
        }
        return date.toISOString().slice(0, 16);
    });
    const [endsAt, setEndsAt] = useState(() => {
        if (!initial?.ends_at) {
            return "";
        }
        const date = new Date(initial.ends_at);
        if (Number.isNaN(date.getTime())) {
            return "";
        }
        return date.toISOString().slice(0, 16);
    });
    const [status, setStatus] = useState<TrailStatus | undefined>(initial?.status);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        const capacityInt = Number(capacity);
        if (!Number.isFinite(capacityInt) || capacityInt <= 0) {
            setError("Capacity must be a positive number.");
            return;
        }
        if (!title.trim()) {
            setError("Title is required.");
            return;
        }
        if (!startsAt || !endsAt) {
            setError("Start and end times are required.");
            return;
        }
        if (new Date(startsAt) > new Date(endsAt)) {
            setError("End time must be after start time.");
            return;
        }

        const payload: CreateTrailPayload | UpdateTrailPayload = {
            title: title.trim(),
            description: description.trim() ? description.trim() : undefined,
            starts_at: new Date(startsAt).toISOString(),
            ends_at: new Date(endsAt).toISOString(),
            location: location.trim() ? location.trim() : undefined,
            capacity: capacityInt,
        };

        if (status) {
            (payload as UpdateTrailPayload).status = status;
        }

        try {
            await onSubmit(payload);
            onCancel();
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="text-sm font-medium text-gray-700">
                    Title
                    <input
                        type="text"
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        required
                    />
                </label>
                <label className="text-sm font-medium text-gray-700">
                    Location
                    <input
                        type="text"
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                        value={location}
                        onChange={(event) => setLocation(event.target.value)}
                    />
                </label>
                <label className="text-sm font-medium text-gray-700">
                    Capacity
                    <input
                        type="number"
                        min={1}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                        value={capacity}
                        onChange={(event) => setCapacity(event.target.value)}
                        required
                    />
                </label>
                <label className="text-sm font-medium text-gray-700">
                    Status
                    <select
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                        value={status ?? ""}
                        onChange={(event) =>
                            setStatus(
                                event.target.value ? (event.target.value as TrailStatus) : undefined
                            )
                        }
                    >
                        <option value="">Keep current</option>
                        {Object.entries(TRAIL_STATUS_LABEL).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="text-sm font-medium text-gray-700">
                    Starts at
                    <input
                        type="datetime-local"
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                        value={startsAt}
                        onChange={(event) => setStartsAt(event.target.value)}
                        required
                    />
                </label>
                <label className="text-sm font-medium text-gray-700">
                    Ends at
                    <input
                        type="datetime-local"
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                        value={endsAt}
                        onChange={(event) => setEndsAt(event.target.value)}
                        required
                    />
                </label>
            </div>
            <label className="block text-sm font-medium text-gray-700">
                Description
                <textarea
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                    rows={3}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                />
            </label>
            {error ? (
                <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                    {error}
                </p>
            ) : null}
            <div className="flex flex-wrap justify-end gap-3">
                <button
                    type="button"
                    className="px-5 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    onClick={onCancel}
                    disabled={submitting}
                >
                    Cancel
                </button>
                <Button
                    type="submit"
                    className="px-5 py-2 rounded-lg text-sm"
                    disabled={submitting}
                >
                    {submitting ? "Saving..." : submitLabel}
                </Button>
            </div>
        </form>
    );
}

type ManualRegistrationProps = {
    onSubmit: (payload: { userId: string; note: string }) => Promise<void>;
    submitting: boolean;
};

function ManualRegistrationForm({ onSubmit, submitting }: ManualRegistrationProps) {
    const [userId, setUserId] = useState("");
    const [note, setNote] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        if (!userId.trim()) {
            setError("User ID is required.");
            return;
        }
        try {
            await onSubmit({ userId: userId.trim(), note: note.trim() });
            setUserId("");
            setNote("");
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="text-sm font-medium text-gray-700">
                    Participant NRIC or ID
                    <input
                        type="text"
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                        value={userId}
                        onChange={(event) => setUserId(event.target.value)}
                        required
                    />
                </label>
                <label className="text-sm font-medium text-gray-700">
                    Note
                    <input
                        type="text"
                        maxLength={120}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="Optional organiser note"
                    />
                </label>
            </div>
            {error ? (
                <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                    {error}
                </p>
            ) : null}
            <div className="flex justify-end">
                <Button type="submit" className="px-4 py-2 text-sm" disabled={submitting}>
                    {submitting ? "Adding..." : "Add Participant"}
                </Button>
            </div>
        </form>
    );
}

export default function ManageTrailsPage() {
    const { tokens, user } = useAuth();
    const accessToken = tokens?.access_token ?? null;
    const { organisationId: orgId, activeOrganisation, organisations } = useOrganisation();
    const organiserOrgIds = user?.org_ids ?? [];
    const [trails, setTrails] = useState<Trail[]>([]);
    const [loadingTrails, setLoadingTrails] = useState(false);
    const [trailError, setTrailError] = useState<string | null>(null);
    const [selectedTrailId, setSelectedTrailId] = useState<string | null>(null);
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [registrationsTotal, setRegistrationsTotal] = useState(0);
    const [registrationsHasMore, setRegistrationsHasMore] = useState(false);
    const [registrationsCursor, setRegistrationsCursor] = useState(0);
    const [loadingRegistrations, setLoadingRegistrations] = useState(false);
    const [loadingMoreRegistrations, setLoadingMoreRegistrations] = useState(false);
    const [registrationError, setRegistrationError] = useState<string | null>(null);
    const [alert, setAlert] = useState<AlertState>(null);
    const [invite, setInvite] = useState<InviteToken | null>(null);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteQrUrl, setInviteQrUrl] = useState<string | null>(null);
    const [inviteQrLoading, setInviteQrLoading] = useState(false);
    const [inviteQrError, setInviteQrError] = useState<string | null>(null);
    const [manualRegistrationLoading, setManualRegistrationLoading] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [selectedTrailDetail, setSelectedTrailDetail] = useState<Trail | null>(null);
    const [trailDetailReloadToken, setTrailDetailReloadToken] = useState(0);
    const [trailDetailLoading, setTrailDetailLoading] = useState(false);
    const [trailDetailError, setTrailDetailError] = useState<string | null>(null);
    const [lookupUserId, setLookupUserId] = useState("");
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupError, setLookupError] = useState<string | null>(null);
    const [lookupResult, setLookupResult] = useState<Registration["status"] | null>(null);
    const [lookupProfile, setLookupProfile] = useState<UserSummary | null>(null);
    const [myOrganiserTrails, setMyOrganiserTrails] = useState<Trail[]>([]);
    const [myDataLoading, setMyDataLoading] = useState(false);
    const [myDataError, setMyDataError] = useState<string | null>(null);
    const [inviteDetails, setInviteDetails] = useState<Trail | null>(null);
    const [invitePreviewLoading, setInvitePreviewLoading] = useState(false);
    const [invitePreviewError, setInvitePreviewError] = useState<string | null>(null);
    const [inviteRegisterError, setInviteRegisterError] = useState<string | null>(null);
    const [inviteRegisterResult, setInviteRegisterResult] = useState<Registration | null>(null);
    const [inviteRegisterLoading, setInviteRegisterLoading] = useState(false);
    const [checkinQr, setCheckinQr] = useState<TrailQrToken | null>(null);
    const [checkinQrError, setCheckinQrError] = useState<string | null>(null);
    const [checkinQrLoading, setCheckinQrLoading] = useState(false);
    const [checkinQrImageUrl, setCheckinQrImageUrl] = useState<string | null>(null);
    const [checkinQrImageLoading, setCheckinQrImageLoading] = useState(false);
    const [checkinQrImageError, setCheckinQrImageError] = useState<string | null>(null);
    const [roster, setRoster] = useState<Checkin[]>([]);
    const [rosterLoading, setRosterLoading] = useState(false);
    const [rosterError, setRosterError] = useState<string | null>(null);
    const [participantDirectory, setParticipantDirectory] = useState<Record<string, UserSummary>>({});

    // Activities builder state (persisted per trail in localStorage)
    const [activities, setActivities] = useState<TrailActivity[]>([]);
    const [activitiesError, setActivitiesError] = useState<string | null>(null);
    const [activitiesLoading, setActivitiesLoading] = useState(false);
    const [activitiesSavingId, setActivitiesSavingId] = useState<string | null>(null);
    const [activitiesDeletingId, setActivitiesDeletingId] = useState<string | null>(null);
    const [activityQrLoadingId, setActivityQrLoadingId] = useState<string | null>(null);
    const [bulkQrLoading, setBulkQrLoading] = useState(false);

    const sortedActivities = useMemo(
        () => [...activities].sort((a, b) => a.order - b.order),
        [activities]
    );

    const fetchActivities = useCallback(
        async (trailId: string, options: { showLoading?: boolean } = {}) => {
            if (!accessToken) {
                return;
            }
            const { showLoading = false } = options;
            if (showLoading) {
                setActivitiesLoading(true);
            }
            setActivitiesError(null);
            try {
                const response = await listTrailActivities({ accessToken, trailId });
                const ordered = [...response].sort((a, b) => a.order - b.order);
                setActivities((prev) => {
                    const previous = new Map(prev.map((entry) => [entry.id, entry]));
                    const next = ordered.map((entry) => {
                        const existing = previous.get(entry.id);
                        return {
                            id: entry.id,
                            order: entry.order,
                            title: entry.title,
                            points: entry.points,
                            notes: entry.notes ?? "",
                            qrToken: existing?.qrToken ?? null,
                            qrShareUrl: existing?.qrShareUrl ?? null,
                            qrImageUrl: existing?.qrImageUrl ?? null,
                            isEditing: false,
                            persisted: true,
                        } satisfies TrailActivity;
                    });
                    prev.forEach((item) => {
                        if (!ordered.some((record) => record.id === item.id) && item.qrImageUrl) {
                            disposeObjectUrl(item.qrImageUrl);
                        }
                    });
                    return next;
                });
            } catch (err) {
                setActivitiesError(getErrorMessage(err));
                setActivities([]);
            } finally {
                if (showLoading) {
                    setActivitiesLoading(false);
                }
            }
        },
        [accessToken]
    );

    useEffect(() => {
        // Clear existing activity state when switching trails or losing auth
        setActivities((prev) => {
            prev.forEach((activity) => {
                if (activity.qrImageUrl) {
                    disposeObjectUrl(activity.qrImageUrl);
                }
            });
            return [];
        });
        setActivitiesError(null);

        if (!selectedTrailId || !accessToken) {
            setActivitiesLoading(false);
            return;
        }

        void fetchActivities(selectedTrailId, { showLoading: true });
    }, [selectedTrailId, accessToken, fetchActivities]);

    const addActivity = useCallback(() => {
        setActivities((prev) => {
            const nextOrder = (prev.reduce((m, a) => Math.max(m, a.order), 0) || 0) + 1;
            return [
                ...prev,
                {
                    id: makeId(),
                    order: nextOrder,
                    title: "",
                    points: 0,
                    notes: "",
                    qrToken: null,
                    qrShareUrl: null,
                    qrImageUrl: null,
                    isEditing: true,
                    persisted: false,
                },
            ];
        });
    }, []);

    const removeActivity = useCallback(
        async (id: string) => {
            setActivitiesError(null);
            const target = activities.find((a) => a.id === id);
            if (!target) {
                return;
            }
            if (!target.persisted) {
                setActivities((prev) => {
                    const toRemove = prev.find((a) => a.id === id);
                    if (toRemove?.qrImageUrl) {
                        disposeObjectUrl(toRemove.qrImageUrl);
                    }
                    const remaining = prev
                        .filter((a) => a.id !== id)
                        .sort((a, b) => a.order - b.order)
                        .map((a, index) => ({ ...a, order: index + 1 }));
                    return remaining;
                });
                return;
            }
            if (!selectedTrailId || !accessToken) {
                setActivitiesError("Select a trail first.");
                return;
            }
            setActivitiesDeletingId(id);
            try {
                await deleteTrailActivity({
                    accessToken,
                    trailId: selectedTrailId,
                    activityId: id,
                });
                if (target.qrImageUrl) {
                    disposeObjectUrl(target.qrImageUrl);
                }
                await fetchActivities(selectedTrailId);
                setAlert({ type: "success", message: "Activity removed." });
            } catch (err) {
                setActivitiesError(getErrorMessage(err));
            } finally {
                setActivitiesDeletingId(null);
            }
        },
        [activities, accessToken, selectedTrailId, fetchActivities]
    );

    const moveActivity = useCallback(
        async (id: string, direction: -1 | 1) => {
            if (!selectedTrailId || !accessToken) {
                setActivitiesError("Select a trail first.");
                return;
            }
            const items = [...sortedActivities];
            const currentIndex = items.findIndex((a) => a.id === id);
            if (currentIndex < 0) {
                return;
            }
            const targetIndex = currentIndex + direction;
            if (targetIndex < 0 || targetIndex >= items.length) {
                return;
            }
            const currentItem = items[currentIndex];
            if (!currentItem.persisted) {
                setActivitiesError("Save the activity before reordering.");
                return;
            }
            const targetOrder = items[targetIndex].order;
            setActivitiesSavingId(id);
            try {
                await updateTrailActivity({
                    accessToken,
                    trailId: selectedTrailId,
                    activityId: id,
                    payload: { order: targetOrder },
                });
                await fetchActivities(selectedTrailId);
            } catch (err) {
                setActivitiesError(getErrorMessage(err));
            } finally {
                setActivitiesSavingId(null);
            }
        },
        [accessToken, selectedTrailId, sortedActivities, fetchActivities]
    );

    const updateActivityField = useCallback(
        (id: string, patch: Partial<Pick<TrailActivity, "title" | "points" | "notes">>) => {
            setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
        },
        []
    );

    const setActivityEditing = useCallback((id: string, editing: boolean) => {
        setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, isEditing: editing } : a)));
    }, []);

    const saveActivity = useCallback(
        async (id: string) => {
            setActivitiesError(null);
            const target = activities.find((a) => a.id === id);
            if (!target) {
                return;
            }
            const title = (target.title ?? "").trim();
            const points = Number.isFinite(target.points)
                ? Math.max(0, Math.floor(target.points))
                : 0;
            if (!title) {
                setActivitiesError("Activity title is required.");
                return;
            }

            const notesValue = target.notes ? target.notes.trim() : "";
            setActivities((prev) =>
                prev.map((a) =>
                    a.id === id
                        ? { ...a, title, points, notes: notesValue }
                        : a
                )
            );

            if (!selectedTrailId || !accessToken) {
                setActivitiesError("Select a trail first.");
                return;
            }

            setActivitiesSavingId(id);
            try {
                if (target.persisted) {
                    await updateTrailActivity({
                        accessToken,
                        trailId: selectedTrailId,
                        activityId: id,
                        payload: {
                            title,
                            points,
                            notes: notesValue ? notesValue : null,
                            order: target.order,
                        },
                    });
                } else {
                    await createTrailActivity({
                        accessToken,
                        trailId: selectedTrailId,
                        payload: {
                            title,
                            points,
                            notes: notesValue ? notesValue : undefined,
                            order: target.order,
                        },
                    });
                }
                await fetchActivities(selectedTrailId);
                setAlert({ type: "success", message: "Activity saved." });
            } catch (err) {
                setActivitiesError(getErrorMessage(err));
                setActivities((prev) =>
                    prev.map((a) =>
                        a.id === id ? { ...a, isEditing: true } : a
                    )
                );
            } finally {
                setActivitiesSavingId(null);
            }
        },
        [activities, accessToken, selectedTrailId, fetchActivities]
    );

    const selectedTrail = useMemo(
        () => trails.find((trail) => trail.id === selectedTrailId) ?? null,
        [selectedTrailId, trails]
    );
    const generateActivityQr = useCallback(
        async (id: string) => {
            if (!accessToken || !selectedTrailId) {
                setActivitiesError("Select a trail first.");
                return;
            }
            setActivitiesError(null);
            setActivityQrLoadingId(id);
            try {
                const activity = activities.find((entry) => entry.id === id);
                if (!activity) {
                    setActivitiesError("Activity not found.");
                    return;
                }
                const qr = await createActivityQr({
                    accessToken,
                    trailId: selectedTrailId,
                    activityId: activity.id,
                    activityOrder: activity.order,
                    points: activity.points,
                });
                const shareUrl = qr.url
                    ? qr.url
                    : appendQuery("/checkin/scan", {
                          token: qr.token,
                          a: activity.order,
                          p: activity.points,
                          t: activity.id,
                      });
                const dataUrl = await QRCode.toDataURL(shareUrl, { width: 320, margin: 1 });
                setActivities((prev) =>
                    prev.map((a) => {
                        if (a.id !== id) return a;
                        if (a.qrImageUrl) {
                            disposeObjectUrl(a.qrImageUrl);
                        }
                        return {
                            ...a,
                            qrToken: qr,
                            qrShareUrl: shareUrl,
                            qrImageUrl: dataUrl,
                        };
                    })
                );
                setAlert({ type: "success", message: "Generated activity QR." });
            } catch (err) {
                setActivitiesError(getErrorMessage(err));
                setAlert({ type: "error", message: getErrorMessage(err) });
            } finally {
                setActivityQrLoadingId(null);
            }
        },
        [accessToken, activities, selectedTrailId]
    );

    const generateAllActivityQrs = useCallback(async () => {
        if (!accessToken || !selectedTrailId) {
            setActivitiesError("Select a trail first.");
            return;
        }
        setActivitiesError(null);
        setBulkQrLoading(true);
        try {
            for (const item of sortedActivities) {
                // eslint-disable-next-line no-await-in-loop
                const qr = await createActivityQr({
                    accessToken,
                    trailId: selectedTrailId,
                    activityId: item.id,
                    activityOrder: item.order,
                    points: item.points,
                });
                const shareUrl = qr.url
                    ? qr.url
                    : appendQuery("/checkin/scan", {
                          token: qr.token,
                          a: item.order,
                          p: item.points,
                          t: item.id,
                      });
                // eslint-disable-next-line no-await-in-loop
                const dataUrl = await QRCode.toDataURL(shareUrl, { width: 320, margin: 1 });
                setActivities((prev) =>
                    prev.map((a) => {
                        if (a.id !== item.id) return a;
                        if (a.qrImageUrl) {
                            disposeObjectUrl(a.qrImageUrl);
                        }
                        return {
                            ...a,
                            qrToken: qr,
                            qrShareUrl: shareUrl,
                            qrImageUrl: dataUrl,
                        };
                    })
                );
            }
            setAlert({ type: "success", message: "Generated QRs for all activities." });
        } catch (err) {
            setActivitiesError(getErrorMessage(err));
            setAlert({ type: "error", message: getErrorMessage(err) });
        } finally {
            setBulkQrLoading(false);
        }
    }, [accessToken, selectedTrailId, sortedActivities]);

    const copyActivityLink = useCallback(
        (item: TrailActivity) => {
            if (!item.qrToken) return;
            if (typeof navigator === "undefined" || !navigator.clipboard) {
                setAlert({ type: "error", message: "Clipboard copy is unavailable in this browser." });
                return;
            }
            const enriched =
                item.qrShareUrl ??
                appendQuery(item.qrToken.url, {
                    a: item.order,
                    p: item.points,
                    t: item.id,
                });
            void navigator.clipboard
                .writeText(enriched)
                .then(() => setAlert({ type: "success", message: "Activity link copied to clipboard." }))
                .catch(() => setAlert({ type: "error", message: "Unable to copy link." }));
        },
        []
    );


    useEffect(() => {
        if (!accessToken) {
            setParticipantDirectory({});
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const listings = await listParticipants({ accessToken });
                if (!cancelled) {
                    setParticipantDirectory(() => {
                        const next: Record<string, UserSummary> = {};
                        listings.forEach((participant) => {
                            next[participant.id] = participant;
                        });
                        return next;
                    });
                }
            } catch (err) {
                if (!cancelled) {
                    console.warn("Failed to load participant directory", err);
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [accessToken]);

    const upsertParticipantProfile = useCallback((profile: UserSummary | null | undefined) => {
        if (!profile) {
            return;
        }
        setParticipantDirectory((prev) => {
            const existing = prev[profile.id];
            if (existing && existing.name === profile.name && existing.nric === profile.nric) {
                return prev;
            }
            return { ...prev, [profile.id]: profile };
        });
    }, []);

    const describeParticipant = useCallback(
        (userId: string) => formatParticipantIdentity(participantDirectory[userId], userId),
        [participantDirectory]
    );
    const participantIdentityOf = useCallback(
        (userId: string) => resolveParticipantIdentity(participantDirectory[userId], userId),
        [participantDirectory]
    );



    const trailInfo = selectedTrailDetail ?? selectedTrail;
    const trailsById = useMemo(() => new Map(trails.map((trail) => [trail.id, trail])), [trails]);
    const organisationNameById = useMemo(() => {
        const map = new Map<string, string>();
        organisations.forEach((org) => map.set(org.id, org.name));
        if (activeOrganisation) {
            map.set(activeOrganisation.id, activeOrganisation.name);
        }
        return map;
    }, [organisations, activeOrganisation]);

    const organiserActivityStats = useMemo(() => {
        const total = myOrganiserTrails.length;
        const draft = myOrganiserTrails.filter((trail) => trail.status === "draft").length;
        const published = myOrganiserTrails.filter((trail) => trail.status === "published").length;
        const upcoming = myOrganiserTrails.filter((trail) => {
            const starts = new Date(trail.starts_at).getTime();
            return Number.isFinite(starts) && starts > Date.now();
        }).length;
        return { total, draft, published, upcoming };
    }, [myOrganiserTrails]);

    const recentOrganiserTrails = useMemo(() => {
        return [...myOrganiserTrails]
            .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())
            .slice(0, 5);
    }, [myOrganiserTrails]);

    const handleOpenTrail = useCallback(
        (trail: Trail) => {
            setSelectedTrailId(trail.id);
            setSelectedTrailDetail(trail);
        },
        []
    );
    const checkinLink = useMemo(() => {
        if (!checkinQr) {
            return null;
        }
        const raw = checkinQr.url;
        if (raw.startsWith("http://") || raw.startsWith("https://")) {
            return raw;
        }
        if (typeof window !== "undefined") {
            try {
                return new URL(raw, window.location.origin).toString();
            } catch {
                return raw;
            }
        }
        return raw;
    }, [checkinQr]);

    useEffect(() => {
        return () => {
            if (checkinQrImageUrl) {
                disposeObjectUrl(checkinQrImageUrl);
            }
        };
    }, [checkinQrImageUrl]);

    const refreshTrails = useCallback(async () => {
        if (!accessToken || !orgId) {
            return;
        }
        setLoadingTrails(true);
        setTrailError(null);
        try {
            const data = await listTrails({ accessToken, orgId });
            const sorted = [...data].sort((a, b) => {
                const aTime = new Date(a.starts_at).getTime();
                const bTime = new Date(b.starts_at).getTime();
                return aTime - bTime;
            });
            setTrails(sorted);

            let nextSelectedId: string | null = null;
            setSelectedTrailId((current) => {
                const stillExists =
                    current && sorted.some((trail) => trail.id === current);
                nextSelectedId = stillExists ? current : sorted[0]?.id ?? null;
                return nextSelectedId;
            });

            if (
                nextSelectedId &&
                nextSelectedId === selectedTrailId
            ) {
                setTrailDetailReloadToken((token) => token + 1);
            }
        } catch (err) {
            setTrailError(getErrorMessage(err));
        } finally {
            setLoadingTrails(false);
        }
    }, [accessToken, orgId, selectedTrailId]);

    const refreshMyData = useCallback(async () => {
        if (!accessToken) {
            setMyOrganiserTrails([]);
            return;
        }
        setMyDataLoading(true);
        setMyDataError(null);
        try {
            const trails = await listMyOrganiserTrails({ accessToken, limit: 50 });
            setMyOrganiserTrails(trails);
        } catch (err) {
            setMyDataError(getErrorMessage(err));
        } finally {
            setMyDataLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        if (!accessToken || !orgId) {
            return;
        }
        void refreshTrails();
    }, [accessToken, orgId, refreshTrails]);

    useEffect(() => {
        if (!accessToken) {
            setMyOrganiserTrails([]);
            setMyDataError(null);
            setMyDataLoading(false);
            return;
        }
        void refreshMyData();
    }, [accessToken, refreshMyData]);

    useEffect(() => {
        if (!accessToken || !selectedTrailId) {
            setSelectedTrailDetail(null);
            setTrailDetailError(null);
            setTrailDetailLoading(false);
            return;
        }
        let cancelled = false;
        setTrailDetailLoading(true);
        setTrailDetailError(null);
        getTrail({ accessToken, trailId: selectedTrailId })
            .then((detail) => {
                if (!cancelled) {
                    setSelectedTrailDetail(detail);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setTrailDetailError(getErrorMessage(err));
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setTrailDetailLoading(false);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [accessToken, selectedTrailId, trailDetailReloadToken]);

    const refreshRegistrations = useCallback(
        async (trailId: string) => {
            if (!accessToken) {
                return;
            }
            setLoadingRegistrations(true);
            setLoadingMoreRegistrations(false);
            setRegistrationError(null);
            try {
                const page = await getTrailRegistrations({
                    accessToken,
                    trailId,
                    limit: REGISTRATIONS_PAGE_SIZE,
                    offset: 0,
                });
                setRegistrations(page.items);
                setRegistrationsTotal(page.total);
                setRegistrationsHasMore(page.hasMore);
                setRegistrationsCursor(page.offset + page.items.length);
            } catch (err) {
                setRegistrationError(getErrorMessage(err));
                setRegistrations([]);
                setRegistrationsTotal(0);
                setRegistrationsHasMore(false);
                setRegistrationsCursor(0);
            } finally {
                setLoadingRegistrations(false);
            }
        },
        [accessToken]
    );

    const loadMoreRegistrations = useCallback(async () => {
        if (!accessToken || !selectedTrailId || !registrationsHasMore) {
            return;
        }
        setLoadingMoreRegistrations(true);
        try {
            const page = await getTrailRegistrations({
                accessToken,
                trailId: selectedTrailId,
                limit: REGISTRATIONS_PAGE_SIZE,
                offset: registrationsCursor,
            });
            setRegistrations((state) => {
                const incomingMap = new Map(page.items.map((entry) => [entry.id, entry]));
                const existingIds = new Set(state.map((entry) => entry.id));
                const updated = state.map((entry) => incomingMap.get(entry.id) ?? entry);
                const appended = page.items.filter((entry) => !existingIds.has(entry.id));
                return [...updated, ...appended];
            });
            setRegistrationsTotal(page.total);
            setRegistrationsHasMore(page.hasMore);
            setRegistrationsCursor(page.offset + page.items.length);
        } catch (err) {
            setRegistrationError(getErrorMessage(err));
        } finally {
            setLoadingMoreRegistrations(false);
        }
    }, [accessToken, registrationsCursor, registrationsHasMore, selectedTrailId]);

    const refreshRoster = useCallback(
        async (trailId: string) => {
            if (!accessToken) {
                return;
            }
            setRosterLoading(true);
            setRosterError(null);
            try {
                const data = await getTrailRoster({ accessToken, trailId });
                setRoster(data);
            } catch (err) {
                setRosterError(getErrorMessage(err));
                setRoster([]);
            } finally {
                setRosterLoading(false);
            }
        },
        [accessToken]
    );

    const handleLookupRegistration = useCallback(
        async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            if (!accessToken || !selectedTrailId) {
                setLookupError("Select a trail first.");
                return;
            }
            const identifier = lookupUserId.trim();
            if (!identifier) {
                setLookupError("Enter a NRIC or user ID to look up.");
                return;
            }
            setLookupLoading(true);
            setLookupError(null);
            setLookupResult(null);
            setLookupProfile(null);
            try {
                const { userId: resolvedUserId, profile } = await resolveParticipantUserId({
                    accessToken,
                    identifier,
                });
                upsertParticipantProfile(profile);
                const result = await getRegistrationStatus({
                    accessToken,
                    trailId: selectedTrailId,
                    userId: resolvedUserId,
                });
                setLookupResult(result.status);
                if (profile) {
                    setLookupProfile(profile);
                }
            } catch (err) {
                setLookupError(getErrorMessage(err));
            } finally {
                setLookupLoading(false);
            }
        },
        [accessToken, lookupUserId, selectedTrailId, upsertParticipantProfile]
    );

    const handlePreviewInvite = useCallback(async () => {
        if (!accessToken || !invite?.invite_token) {
            setInvitePreviewError("Generate an invite first.");
            return;
        }
        setInvitePreviewLoading(true);
        setInvitePreviewError(null);
        try {
            const preview = await previewInvite({
                accessToken,
                token: invite.invite_token,
            });
            setInviteDetails(preview.trail);
        } catch (err) {
            setInvitePreviewError(getErrorMessage(err));
            setInviteDetails(null);
        } finally {
            setInvitePreviewLoading(false);
        }
    }, [accessToken, invite]);

    const handleAcceptInvite = useCallback(async () => {
        if (!accessToken || !invite?.invite_token) {
            setInviteRegisterError("Generate an invite first.");
            return;
        }
        setInviteRegisterLoading(true);
        setInviteRegisterError(null);
        setInviteRegisterResult(null);
        try {
            const registration = await acceptInvite({
                accessToken,
                token: invite.invite_token,
            });
            setInviteRegisterResult(registration);
            if (selectedTrailId && registration.trail_id === selectedTrailId) {
                await refreshRegistrations(selectedTrailId);
            }
            await refreshMyData();
        } catch (err) {
            setInviteRegisterError(getErrorMessage(err));
        } finally {
            setInviteRegisterLoading(false);
        }
    }, [accessToken, invite, refreshMyData, refreshRegistrations, selectedTrailId]);

    const handleGenerateQr = useCallback(async () => {
        if (!accessToken || !selectedTrail) {
            setAlert({ type: "error", message: "Select a trail first." });
            return;
        }
        setCheckinQrLoading(true);
        setCheckinQrError(null);
        if (checkinQrImageUrl) {
            URL.revokeObjectURL(checkinQrImageUrl);
        }
        setCheckinQrImageUrl(null);
        setCheckinQrImageError(null);
        setCheckinQrImageLoading(false);
        try {
            const qr = await createTrailQr({ accessToken, trailId: selectedTrail.id });
            setCheckinQr(qr);
            setAlert({ type: "success", message: "Generated a new check-in QR token." });
        } catch (err) {
            const message = getErrorMessage(err);
            setCheckinQrError(message);
            setAlert({ type: "error", message });
        } finally {
            setCheckinQrLoading(false);
        }
    }, [accessToken, checkinQrImageUrl, selectedTrail]);

    const copyCheckinLink = useCallback(() => {
        if (!checkinQr) {
            return;
        }
        if (typeof navigator === "undefined" || !navigator.clipboard) {
            setAlert({ type: "error", message: "Clipboard copy is unavailable in this browser." });
            return;
        }
        const text = (() => {
            if (!checkinLink) {
                return checkinQr.url;
            }
            return checkinLink;
        })();
        void navigator.clipboard
            .writeText(text)
            .then(() => setAlert({ type: "success", message: "Check-in link copied to clipboard." }))
            .catch(() =>
                setAlert({
                    type: "error",
                    message: "Unable to copy link. Copy it manually instead.",
                })
            );
    }, [checkinLink, checkinQr]);

    const handleLoadQrImage = useCallback(async () => {
        if (!accessToken || !selectedTrail) {
            setAlert({ type: "error", message: "Select a trail first." });
            return;
        }
        setCheckinQrImageLoading(true);
        setCheckinQrImageError(null);
        if (checkinQrImageUrl) {
            URL.revokeObjectURL(checkinQrImageUrl);
            setCheckinQrImageUrl(null);
        }
        try {
            const blob = await getTrailQrImage({ accessToken, trailId: selectedTrail.id });
            const objectUrl = URL.createObjectURL(blob);
            setCheckinQrImageUrl(objectUrl);
        } catch (err) {
            const message = getErrorMessage(err);
            setCheckinQrImageError(message);
            setAlert({ type: "error", message });
        } finally {
            setCheckinQrImageLoading(false);
        }
    }, [accessToken, checkinQrImageUrl, selectedTrail]);

    useEffect(() => {
        if (!selectedTrailId) {
            setRegistrations([]);
            setRegistrationsTotal(0);
            setRegistrationsHasMore(false);
            setRegistrationsCursor(0);
            setLookupUserId("");
            setLookupResult(null);
            setLookupProfile(null);
            setLookupError(null);
            setInvite(null);
            setInviteDetails(null);
            setInvitePreviewError(null);
            setInviteRegisterError(null);
            setInviteRegisterResult(null);
            if (checkinQrImageUrl) {
                URL.revokeObjectURL(checkinQrImageUrl);
            }
            setCheckinQr(null);
            setCheckinQrError(null);
            setCheckinQrLoading(false);
            setCheckinQrImageUrl(null);
            setCheckinQrImageError(null);
            setCheckinQrImageLoading(false);
            setRoster([]);
            setRosterError(null);
            setRosterLoading(false);
            return;
        }
        setLookupResult(null);
        setLookupProfile(null);
        setLookupError(null);
        setInviteDetails(null);
        setInvitePreviewError(null);
        setInviteRegisterError(null);
        setInviteRegisterResult(null);
        void refreshRegistrations(selectedTrailId);
        void refreshRoster(selectedTrailId);
    }, [checkinQrImageUrl, refreshRegistrations, refreshRoster, selectedTrailId]);

    const handleCreateTrail = useCallback(
        async (payload: CreateTrailPayload | UpdateTrailPayload) => {
            if (!accessToken || !orgId) {
                throw new Error("Select an organisation before creating a trail.");
            }
            setFormSubmitting(true);
            try {
                const created = await createTrail({
                    accessToken,
                    orgId,
                    payload: payload as CreateTrailPayload,
                });
                setAlert({ type: "success", message: `Created “${created.title}”.` });
                await refreshTrails();
                setSelectedTrailId(created.id);
            } finally {
                setFormSubmitting(false);
            }
        },
        [accessToken, orgId, refreshTrails]
    );

    const handleUpdateTrail = useCallback(
        async (payload: CreateTrailPayload | UpdateTrailPayload) => {
            if (!accessToken || !selectedTrail) {
                throw new Error("Select a trail before editing.");
            }
            setFormSubmitting(true);
            try {
                const updated = await updateTrail({
                    accessToken,
                    trailId: selectedTrail.id,
                    payload: payload as UpdateTrailPayload,
                });
                setAlert({ type: "success", message: `Updated “${updated.title}”.` });
                setTrails((state) => state.map((trail) => (trail.id === updated.id ? updated : trail)));
                await refreshRegistrations(updated.id);
            } finally {
                setFormSubmitting(false);
            }
        },
        [accessToken, describeParticipant, refreshRegistrations, selectedTrail, upsertParticipantProfile]
    );

    const mutateRegistrationStatus = useCallback(
        async (
            fn: (options: { accessToken: string; registrationId: string }) => Promise<Registration>,
            registration: Registration
        ) => {
            if (!accessToken) {
                throw new Error("Missing organiser session.");
            }
            try {
                const updated = await fn({ accessToken, registrationId: registration.id });
                setRegistrations((state) =>
                    state.map((entry) => (entry.id === updated.id ? updated : entry))
                );
                setAlert({
                    type: "success",
                    message: `Updated registration for attendee ${describeParticipant(updated.user_id)}.`,
                });
            } catch (err) {
                setAlert({ type: "error", message: getErrorMessage(err) });
            }
        },
        [accessToken]
    );

    const handleManualRegistration = useCallback(
        async ({ userId, note }: { userId: string; note: string }) => {
            if (!accessToken || !selectedTrail) {
                throw new Error("Select a trail first.");
            }
            setManualRegistrationLoading(true);
            try {
                const { userId: resolvedUserId, profile } = await resolveParticipantUserId({
                    accessToken,
                    identifier: userId,
                });
                upsertParticipantProfile(profile);

                if (
                    profile &&
                    selectedTrail &&
                    !profile.org_ids.map(String).includes(String(selectedTrail.org_id))
                ) {
                    throw new Error(
                        `${profile.name} is not assigned to this organisation yet. Ask an admin to link them before registering.`
                    );
                }

                const created = await createRegistrationForTrail({
                    accessToken,
                    trailId: selectedTrail.id,
                    payload: { user_id: resolvedUserId, note: note || undefined },
                });
                await refreshRegistrations(selectedTrail.id);
                setAlert({
                    type: "success",
                    message: `Added attendee ${describeParticipant(created.user_id)} as ${REGISTRATION_STATUS_LABEL[created.status]}.`,
                });
            } finally {
                setManualRegistrationLoading(false);
            }
        },
        [accessToken, refreshRegistrations, selectedTrail]
    );

    const handleCreateInvite = useCallback(async () => {
        if (!accessToken || !selectedTrail) {
            setAlert({ type: "error", message: "Select a trail first." });
            return;
        }
        setInviteDetails(null);
        setInvitePreviewError(null);
        setInvitePreviewLoading(false);
        setInviteRegisterError(null);
        setInviteRegisterResult(null);
        setInviteRegisterLoading(false);
        setInviteLoading(true);
        try {
            const data = await createTrailInvite({ accessToken, trailId: selectedTrail.id });
            setInvite(data);
            setAlert({
                type: "success",
                message: "Generated a fresh invitation link.",
            });
        } catch (err) {
            setAlert({ type: "error", message: getErrorMessage(err) });
        } finally {
            setInviteLoading(false);
        }
    }, [accessToken, selectedTrail]);

    const copyInvite = useCallback(() => {
        if (!invite) {
            return;
        }
        const text = invite.url ?? invite.invite_token;
        if (typeof navigator === "undefined" || !navigator.clipboard) {
            setAlert({ type: "error", message: "Clipboard copy is unavailable in this browser." });
            return;
        }
        void navigator.clipboard
            .writeText(text)
            .then(() => setAlert({ type: "success", message: "Invitation copied to clipboard." }))
            .catch(() =>
                setAlert({ type: "error", message: "Unable to copy link. Copy it manually instead." })
            );
    }, [invite]);

    useEffect(() => {
        let active = true;
        const generate = async () => {
            if (!invite) {
                if (active) {
                    setInviteQrUrl(null);
                    setInviteQrError(null);
                    setInviteQrLoading(false);
                }
                return;
            }
            setInviteQrLoading(true);
            setInviteQrError(null);
            try {
                const target = invite.url ?? invite.invite_token;
                const dataUrl = await QRCode.toDataURL(target, { width: 320, margin: 1 });
                if (active) {
                    setInviteQrUrl(dataUrl);
                }
            } catch (err) {
                if (active) {
                    setInviteQrUrl(null);
                    setInviteQrError("Unable to generate the invite QR image. Copy the link instead.");
                }
            } finally {
                if (active) {
                    setInviteQrLoading(false);
                }
            }
        };
        void generate();
        return () => {
            active = false;
        };
    }, [invite]);

    const downloadInviteQr = useCallback(() => {
        if (!inviteQrUrl || typeof window === "undefined") {
            return;
        }
        try {
            const link = document.createElement("a");
            const safeTitle =
                selectedTrailDetail?.title?.replace(/\s+/g, "-").toLowerCase() ?? "trail-invite";
            link.href = inviteQrUrl;
            link.download = `${safeTitle}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            setAlert({ type: "error", message: "Unable to download QR image. Try right-clicking the preview instead." });
        }
    }, [inviteQrUrl, selectedTrailDetail?.title]);

    useEffect(() => {
        if (!alert) {
            return;
        }
        const id = window.setTimeout(() => {
            setAlert(null);
        }, 6000);
        return () => window.clearTimeout(id);
    }, [alert]);

    if (!accessToken) {
        return (
            <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-8 text-center">
                <p className="text-gray-700">
                    Sign in as an organiser to manage trails.
                </p>
            </div>
        );
    }

    if (!orgId) {
        return <OrganisationRequiredCard />;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-800">Manage Trails</h2>
                    <p className="text-sm text-gray-500">
                        Organisation: {activeOrganisation?.name ?? orgId ?? "N/A"}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        onClick={() => void refreshTrails()}
                        disabled={loadingTrails}
                    >
                        {loadingTrails ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4" />
                        )}
                        Refresh
                    </button>
                    <Button
                        className="flex items-center gap-2 px-4 py-2 text-sm"
                        onClick={() => {
                            setShowCreateForm((value) => !value);
                            setShowEditForm(false);
                        }}
                    >
                        <Plus className="h-4 w-4" />
                        New Trail
                    </Button>
                </div>
            </div>

            {alert ? (
                <div
                    className={`rounded-xl border px-4 py-3 text-sm ${alert.type === "success"
                        ? "border-teal-200 bg-teal-50 text-teal-700"
                        : "border-rose-200 bg-rose-50 text-rose-600"
                        }`}
                >
                    {alert.message}
                </div>
            ) : null}

            {trailError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                    {trailError}
                </div>
            ) : null}

            {showCreateForm ? (
                <Card className="p-6 border border-gray-200 shadow-sm">
                    <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
                        <Plus className="h-5 w-5 text-teal-500" />
                        Create a new trail
                    </div>
                    <TrailForm
                        submitting={formSubmitting}
                        submitLabel="Create Trail"
                        onSubmit={handleCreateTrail}
                        onCancel={() => setShowCreateForm(false)}
                    />
                </Card>
            ) : null}

            {selectedTrail && showEditForm ? (
                <Card className="p-6 border border-gray-200 shadow-sm">
                    <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
                        <Edit3 className="h-5 w-5 text-orange-500" />
                        Edit “{trailInfo?.title ?? selectedTrail.title}”
                    </div>
                    <TrailForm
                        initial={{
                            title: trailInfo?.title ?? selectedTrail.title,
                            description: trailInfo?.description ?? undefined,
                            starts_at: trailInfo?.starts_at ?? selectedTrail.starts_at,
                            ends_at: trailInfo?.ends_at ?? selectedTrail.ends_at,
                            location: trailInfo?.location ?? undefined,
                            capacity: trailInfo?.capacity ?? selectedTrail.capacity,
                            status: trailInfo?.status ?? selectedTrail.status,
                        }}
                        submitting={formSubmitting}
                        submitLabel="Save Changes"
                        onSubmit={handleUpdateTrail}
                        onCancel={() => setShowEditForm(false)}
                    />
                </Card>
            ) : null}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                <Card className="lg:col-span-2 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-4 text-sm font-semibold text-gray-700">
                        <Activity className="h-4 w-4 text-teal-500" />
                        Trails
                    </div>
                    {loadingTrails ? (
                        <div className="flex items-center justify-center py-12 text-teal-600">
                            <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                    ) : trails.length === 0 ? (
                        <div className="px-6 py-8 text-sm text-gray-500">
                            No trails yet. Start by creating one.
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {trails.map((trail) => {
                                const active = trail.id === selectedTrailId;
                                return (
                                    <li key={trail.id}>
                                        <button
                                            onClick={() => {
                                                setSelectedTrailId(trail.id);
                                                setShowEditForm(false);
                                                setInvite(null);
                                            }}
                                            className={`w-full text-left px-6 py-4 transition ${active ? "bg-teal-50" : "hover:bg-gray-50"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <div className="text-sm font-semibold text-gray-800">
                                                        {trail.title}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {formatDate(trail.starts_at)}
                                                    </div>
                                                </div>
                                                <span
                                                    className="inline-flex items-center rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-700"
                                                >
                                                    {TRAIL_STATUS_LABEL[trail.status]}
                                                </span>
                                            </div>
                                            <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                                                <Users className="h-3 w-3" />
                                                Capacity {trail.capacity}
                                                <CalendarClock className="h-3 w-3" />
                                                Ends {formatDate(trail.ends_at)}
                                            </div>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </Card>

                <Card className="lg:col-span-3 space-y-6 border border-gray-200 shadow-sm p-6">
                    {selectedTrail ? (
                        <>
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-semibold text-gray-800">
                                        {trailInfo?.title ?? "Untitled trail"}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {trailInfo?.location ? `${trailInfo.location} · ` : ""}
                                        {formatDate(trailInfo?.starts_at ?? null)} · {formatDate(trailInfo?.ends_at ?? null)}
                                    </p>
                                    {trailDetailLoading || trailDetailError ? (
                                        <div className="text-xs text-gray-500 space-x-3">
                                            {trailDetailLoading ? (
                                                <span className="text-teal-600">Refreshing details…</span>
                                            ) : null}
                                            {trailDetailError ? (
                                                <span className="text-rose-600">{trailDetailError}</span>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-700">
                                        {trailInfo ? TRAIL_STATUS_LABEL[trailInfo.status] : "Unknown"}
                                    </span>
                                    <button
                                        className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                        onClick={() => {
                                            setShowEditForm((value) => !value);
                                            setShowCreateForm(false);
                                        }}
                                    >
                                        <Edit3 className="h-3 w-3" />
                                        Edit details
                                    </button>
                                    <button
                                        className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                        onClick={handleCreateInvite}
                                        disabled={inviteLoading}
                                    >
                                        {inviteLoading ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <QrCode className="h-3 w-3" />
                                        )}
                                        Generate invite
                                    </button>
                                </div>
                            </div>

                            {trailInfo?.description ? (
                                <p className="text-sm text-gray-600">{trailInfo.description}</p>
                            ) : null}

                            {invite ? (
                                <div className="space-y-3 rounded-lg border border-dashed border-teal-300 bg-teal-50 px-4 py-4 text-sm text-teal-800">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <div className="font-semibold">Invitation link</div>
                                            <div className="break-all text-xs text-teal-700">{invite.url}</div>
                                            <div className="text-xs text-teal-600">
                                                Expires at {formatDate(invite.expires_at)}
                                            </div>
                                        </div>
                                         <div className="flex flex-wrap gap-2">
                                             <Button
                                                 variant="ghost"
                                                 className="border border-white px-3 py-1 text-xs"
                                                 onClick={copyInvite}
                                            >
                                                <Copy className="h-3 w-3" /> Copy
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="border border-white px-3 py-1 text-xs"
                                                onClick={handlePreviewInvite}
                                                disabled={invitePreviewLoading}
                                            >
                                                {invitePreviewLoading ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <Activity className="h-3 w-3" />
                                                )}
                                                Preview
                                            </Button>
                                             <Button
                                                 variant="ghost"
                                                 className="border border-white px-3 py-1 text-xs"
                                                 onClick={handleAcceptInvite}
                                                 disabled={inviteRegisterLoading}
                                             >
                                                {inviteRegisterLoading ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <Users className="h-3 w-3" />
                                                )}
                                                 Test invite
                                             </Button>
                                             <Button
                                                 variant="ghost"
                                                 className="border border-white px-3 py-1 text-xs"
                                                 onClick={downloadInviteQr}
                                                 disabled={inviteQrLoading || !inviteQrUrl}
                                             >
                                                 {inviteQrLoading ? (
                                                     <Loader2 className="h-3 w-3 animate-spin" />
                                                 ) : (
                                                     <Download className="h-3 w-3" />
                                                 )}
                                                 Invite QR
                                             </Button>
                                         </div>
                                     </div>
                                     {inviteQrLoading ? (
                                         <p className="text-xs text-teal-600">Preparing QR image…</p>
                                     ) : inviteQrUrl ? (
                                         <div className="flex flex-wrap items-center gap-4 rounded-lg border border-white/60 bg-white/70 p-3">
                                             <div className="rounded-xl bg-white p-3 shadow">
                                                 <img
                                                     src={inviteQrUrl}
                                                     alt="Trail invite QR"
                                                     className="h-32 w-32"
                                                 />
                                             </div>
                                             <p className="text-xs text-teal-800 max-w-xs">
                                                 Print or share this QR so seniors can open the invite link directly from
                                                 their camera apps.
                                             </p>
                                         </div>
                                     ) : null}
                                     {inviteQrError ? (
                                         <p className="text-xs text-rose-600">{inviteQrError}</p>
                                     ) : null}
                                     {invitePreviewError ? (
                                         <p className="text-xs text-rose-600">{invitePreviewError}</p>
                                     ) : null}
                                    {inviteDetails ? (
                                        <div className="rounded-md border border-teal-200 bg-white/80 p-3 text-xs text-teal-800">
                                            <div className="font-semibold">Previewed trail</div>
                                            <div>Title: {inviteDetails.title}</div>
                                            <div>Schedule: {formatDate(inviteDetails.starts_at)} · {formatDate(inviteDetails.ends_at)}</div>
                                            <div>Capacity: {inviteDetails.capacity}</div>
                                            <div>Status: {TRAIL_STATUS_LABEL[inviteDetails.status]}</div>
                                        </div>
                                    ) : null}
                                    {inviteRegisterError ? (
                                        <p className="text-xs text-rose-600">{inviteRegisterError}</p>
                                    ) : null}
                                    {inviteRegisterResult ? (
                                        <p className="text-xs text-teal-700">
                                            Registered {describeParticipant(inviteRegisterResult.user_id)} as {REGISTRATION_STATUS_LABEL[inviteRegisterResult.status]}
                                        </p>
                                    ) : null}
                                </div>
                            ) : null}

                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <h4 className="text-lg font-semibold text-gray-800">Check-in QR</h4>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            className="border border-gray-200 px-3 py-1 text-xs"
                                            onClick={handleGenerateQr}
                                            disabled={checkinQrLoading}
                                        >
                                            {checkinQrLoading ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <QrCode className="h-3 w-3" />
                                            )}
                                            Generate QR
                                        </Button>
                                        {checkinQr ? (
                                            <Button
                                                variant="ghost"
                                                className="border border-gray-200 px-3 py-1 text-xs"
                                                onClick={copyCheckinLink}
                                            >
                                                <Copy className="h-3 w-3" /> Copy link
                                            </Button>
                                        ) : null}
                                        <Button
                                            variant="ghost"
                                            className="border border-gray-200 px-3 py-1 text-xs"
                                            onClick={handleLoadQrImage}
                                            disabled={checkinQrImageLoading || checkinQrLoading}
                                        >
                                            {checkinQrImageLoading ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <Download className="h-3 w-3" />
                                            )}
                                            QR PNG
                                        </Button>
                                    </div>
                                </div>
                                {checkinQrError ? (
                                    <p className="text-sm text-rose-600">{checkinQrError}</p>
                                ) : null}
                                {checkinQrImageError ? (
                                    <p className="text-sm text-rose-600">{checkinQrImageError}</p>
                                ) : null}
                                {checkinQr ? (
                                    <div className="space-y-2 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
                                        <div className="text-xs text-teal-700">
                                            Expires {formatDate(new Date(checkinQr.expires_at * 1000).toISOString())}
                                        </div>
                                        {checkinLink ? (
                                            <div className="text-xs text-teal-700 break-all">
                                                {checkinLink}
                                            </div>
                                        ) : null}
                                        <div className="text-xs font-mono break-all text-teal-900">
                                            Token: {checkinQr.token}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">
                                        Generate a time-limited QR token for this trail to admit confirmed participants on-site.
                                    </p>
                                )}
                                {checkinQrImageUrl ? (
                                    <div className="space-y-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
                                        <div className="text-sm font-semibold text-gray-700">Latest QR PNG</div>
                                        <img
                                            src={checkinQrImageUrl}
                                            alt="QR code for trail check-in"
                                            className="h-48 w-48 max-w-full rounded-md border border-gray-100"
                                        />
                                        <a
                                            href={checkinQrImageUrl}
                                            download={`trail-${selectedTrail?.id ?? "qr"}.png`}
                                            className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                        >
                                            <Download className="h-3 w-3" /> Download PNG
                                        </a>
                                    </div>
                                ) : null}
                            </div>

                            {/* Activities builder */}
                            <div className="space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <h4 className="text-lg font-semibold text-gray-800">Activities</h4>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            className="border border-gray-200 px-3 py-1 text-xs"
                                            onClick={addActivity}
                                            disabled={!selectedTrailId || activitiesLoading}
                                        >
                                            <Plus className="h-3 w-3" /> Add activity
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="border border-gray-200 px-3 py-1 text-xs"
                                            onClick={generateAllActivityQrs}
                                            disabled={!sortedActivities.length || bulkQrLoading}
                                        >
                                            {bulkQrLoading ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <QrCode className="h-3 w-3" />
                                            )}
                                            Generate all QRs
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-600">
                                    Participants complete Activity 1, then scan its QR to earn points,
                                    then proceed to Activity 2, and so on.
                                </p>
                                {activitiesError ? (
                                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                                        {activitiesError}
                                    </div>
                                ) : null}
                                {activitiesLoading ? (
                                    <div className="flex justify-center py-6 text-teal-600">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    </div>
                                ) : sortedActivities.length === 0 ? (
                                    <p className="text-sm text-gray-500">No activities yet.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {sortedActivities.map((item, index) => (
                                            <div key={item.id} className="space-y-2 rounded-lg border border-gray-200 bg-white p-3">
                                                {item.isEditing ? (
                                                    <>
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <div className="flex min-w-0 flex-1 items-center gap-2">
                                                                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 text-xs font-semibold text-gray-700">
                                                                    {item.order}
                                                                </div>
                                                                <input
                                                                    className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                                                                    placeholder="Activity title"
                                                                    value={item.title}
                                                                    onChange={(e) => updateActivityField(item.id, { title: e.target.value })}
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                                                                    onClick={() => void moveActivity(item.id, -1)}
                                                                    disabled={!item.persisted || index === 0 || activitiesSavingId === item.id || activitiesLoading}
                                                                >
                                                                    Move up
                                                                </button>
                                                                <button
                                                                    className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                                                                    onClick={() => void moveActivity(item.id, 1)}
                                                                    disabled={!item.persisted || index === sortedActivities.length - 1 || activitiesSavingId === item.id || activitiesLoading}
                                                                >
                                                                    Move down
                                                                </button>
                                                                <button
                                                                    className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
                                                                    onClick={() => void removeActivity(item.id)}
                                                                    disabled={activitiesDeletingId === item.id || activitiesSavingId === item.id}
                                                                >
                                                                    {activitiesDeletingId === item.id ? "Removing..." : "Remove"}
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                                            <label className="text-sm font-medium text-gray-700">
                                                                Points
                                                                <input
                                                                    type="number"
                                                                    min={0}
                                                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                                                                    value={item.points}
                                                                    onChange={(e) => updateActivityField(item.id, { points: Number(e.target.value || 0) })}
                                                                />
                                                            </label>
                                                            <label className="text-sm font-medium text-gray-700 md:col-span-2">
                                                                Notes
                                                                <input
                                                                    type="text"
                                                                    maxLength={120}
                                                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                                                                    placeholder="Optional instructions"
                                                                    value={item.notes ?? ""}
                                                                    onChange={(e) => updateActivityField(item.id, { notes: e.target.value })}
                                                                />
                                                            </label>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                className="border border-gray-200 px-3 py-1 text-xs"
                                                                onClick={() => void saveActivity(item.id)}
                                                                disabled={activitiesSavingId === item.id}
                                                            >
                                                                {activitiesSavingId === item.id ? "Saving..." : "Save"}
                                                            </Button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <div className="flex min-w-0 flex-1 items-center gap-2">
                                                                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 text-xs font-semibold text-gray-700">
                                                                    {item.order}
                                                                </div>
                                                                <div className="min-w-0 truncate text-sm font-medium text-gray-800">
                                                                    {item.title || "Untitled activity"}
                                                                </div>
                                                                {Number(item.points) > 0 ? (
                                                                    <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-medium text-teal-700">
                                                                        {item.points} pts
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                                                                    onClick={() => setActivityEditing(item.id, true)}
                                                                    disabled={activitiesSavingId === item.id || activitiesLoading}
                                                                >
                                                                    Edit details
                                                                </button>
                                                                <Button
                                                                    variant="ghost"
                                                                    className="border border-gray-200 px-3 py-1 text-xs"
                                                                    onClick={() => void generateActivityQr(item.id)}
                                                                    disabled={activityQrLoadingId === item.id}
                                                                >
                                                                    {activityQrLoadingId === item.id ? (
                                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                                    ) : (
                                                                        <QrCode className="h-3 w-3" />
                                                                    )}
                                                                    Generate QR code
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        {item.qrToken ? (
                                                            <div className="space-y-1 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-800">
                                                                <div>Expires {formatDate(new Date(item.qrToken.expires_at * 1000).toISOString())}</div>
                                                                <div className="break-all text-teal-700">
                                                                    {item.qrShareUrl ?? appendQuery(item.qrToken.url, { a: item.order, p: item.points, t: item.id })}
                                                                </div>
                                                                <div className="font-mono text-teal-900">Token: {item.qrToken.token}</div>
                                                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        className="border border-gray-200 px-3 py-1 text-xs"
                                                                        onClick={() => copyActivityLink(item)}
                                                                    >
                                                                        <Copy className="h-3 w-3" /> Copy link
                                                                    </Button>
                                                                    {item.qrImageUrl ? (
                                                                        <a
                                                                            href={item.qrImageUrl}
                                                                            download={`trail-${selectedTrailId ?? "qr"}-activity-${item.order}.png`}
                                                                            className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                                                        >
                                                                            <Download className="h-3 w-3" /> Download PNG
                                                                        </a>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                        ) : null}
                                                        {item.qrImageUrl ? (
                                                            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                                                                <img
                                                                    src={item.qrImageUrl ?? undefined}
                                                                    alt={`QR code for activity ${item.order}`}
                                                                    className="h-40 w-40 max-w-full rounded-md border border-gray-100"
                                                                />
                                                            </div>
                                                        ) : null}
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-2">
                                    <h4 className="text-lg font-semibold text-gray-800">Check-in roster</h4>
                                    <button
                                        className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                        onClick={() =>
                                            selectedTrailId ? void refreshRoster(selectedTrailId) : undefined
                                        }
                                        disabled={rosterLoading || !selectedTrailId}
                                    >
                                        {rosterLoading ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <RefreshCw className="h-3 w-3" />
                                        )}
                                        Refresh
                                    </button>
                                </div>
                                {rosterError ? (
                                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                                        {rosterError}
                                    </div>
                                ) : null}
                                {rosterLoading ? (
                                    <div className="flex justify-center py-6 text-teal-600">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    </div>
                                ) : roster.length === 0 ? (
                                    <p className="text-sm text-gray-500">
                                        No check-ins recorded for this trail yet.
                                    </p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                                            <thead className="bg-gray-50 text-gray-600">
                                                <tr>
                                                    <th className="px-3 py-2 text-left font-medium">Participant</th>
                                                    <th className="px-3 py-2 text-left font-medium">Method</th>
                                                    <th className="px-3 py-2 text-left font-medium">Checked at</th>
                                                    <th className="px-3 py-2 text-left font-medium">Checked by</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {roster.map((entry) => {
                                                    const identity = participantIdentityOf(entry.user_id);
                                                    return (
                                                        <tr key={entry.id}>
                                                            <td className="px-3 py-2 text-gray-800">
                                                                <div className="font-semibold text-gray-900">
                                                                    {identity.name}
                                                                </div>
                                                                {identity.nric ? (
                                                                    <div className="text-xs text-gray-500">
                                                                        {identity.nric}
                                                                    </div>
                                                                ) : null}
                                                                <div className="text-[11px] font-mono text-gray-400 break-all">
                                                                    {identity.shortId}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-2 text-xs text-gray-600 uppercase">
                                                                {entry.method}
                                                            </td>
                                                            <td className="px-3 py-2 text-xs text-gray-500">
                                                                {formatDate(entry.checked_at)}
                                                            </td>
                                                            <td className="px-3 py-2 text-xs text-gray-500">
                                                                {entry.checked_by ?? "-"}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-lg font-semibold text-gray-800">Look up attendee status</h4>
                                <form className="flex flex-wrap gap-2" onSubmit={handleLookupRegistration}>
                                    <input
                                        className="flex-1 min-w-[200px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                                        placeholder="NRIC or User ID"
                                        value={lookupUserId}
                                        onChange={(event) => setLookupUserId(event.target.value)}
                                    />
                                    <Button type="submit" className="px-4 py-2 text-sm" disabled={lookupLoading}>
                                        {lookupLoading ? "Checking..." : "Check status"}
                                    </Button>
                                </form>
                                {lookupError ? (
                                    <p className="text-sm text-rose-600">{lookupError}</p>
                                ) : null}
                                {lookupResult ? (
                                    <p className="text-sm text-teal-700">
                                        Status: {REGISTRATION_STATUS_LABEL[lookupResult]}
                                    </p>
                                ) : null}
                                {lookupProfile ? (
                                    <p className="text-sm text-gray-600">
                                        {lookupProfile.name} · {lookupProfile.nric}
                                    </p>
                                ) : null}
                            </div>

                            <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-600">
                                Capacity {trailInfo?.capacity ?? "-"}. Organisation ID {trailInfo?.org_id ?? "-"}.
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-lg font-semibold text-gray-800">Add participant manually</h4>
                                <ManualRegistrationForm
                                    submitting={manualRegistrationLoading}
                                    onSubmit={handleManualRegistration}
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-2">
                                    <h4 className="text-lg font-semibold text-gray-800">Registrations</h4>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <span>
                                            Showing {registrations.length} of {registrationsTotal}
                                        </span>
                                        {loadingRegistrations ? (
                                            <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                                        ) : null}
                                    </div>
                                </div>
                                {registrationError ? (
                                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                                        {registrationError}
                                    </div>
                                ) : null}
                                {registrations.length === 0 ? (
                                    <p className="text-sm text-gray-500">No registrations yet.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                                            <thead className="bg-gray-50 text-gray-600">
                                                <tr>
                                                    <th className="px-3 py-2 text-left font-medium">Participant</th>
                                                    <th className="px-3 py-2 text-left font-medium">Status</th>
                                                    <th className="px-3 py-2 text-left font-medium">Note</th>
                                                    <th className="px-3 py-2 text-right font-medium">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {registrations.map((registration) => {
                                                    const identity = participantIdentityOf(registration.user_id);
                                                    return (
                                                        <tr key={registration.id} className="align-top">
                                                            <td className="px-3 py-2 text-gray-800">
                                                                <div className="font-semibold text-gray-900">
                                                                    {identity.name}
                                                                </div>
                                                                {identity.nric ? (
                                                                    <div className="text-xs text-gray-500">
                                                                        {identity.nric}
                                                                    </div>
                                                                ) : null}
                                                                <div className="text-[11px] font-mono text-gray-400 break-all">
                                                                    {identity.shortId}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                                                                    {REGISTRATION_STATUS_LABEL[registration.status]}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-2 text-xs text-gray-500">
                                                                {registration.note ?? "-"}
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                <div className="flex flex-wrap justify-end gap-2">
                                                                    <button
                                                                        className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
                                                                        onClick={() =>
                                                                            void mutateRegistrationStatus(approveRegistration, registration)
                                                                        }
                                                                    >
                                                                        Approve
                                                                    </button>
                                                                    <button
                                                                        className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
                                                                        onClick={() =>
                                                                            void mutateRegistrationStatus(confirmRegistration, registration)
                                                                        }
                                                                    >
                                                                        Confirm
                                                                    </button>
                                                                    <button
                                                                        className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
                                                                        onClick={() =>
                                                                            void mutateRegistrationStatus(rejectRegistration, registration)
                                                                        }
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                    <button
                                                                        className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
                                                                        onClick={() =>
                                                                            void mutateRegistrationStatus(cancelRegistration, registration)
                                                                        }
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                {registrationsHasMore ? (
                                    <div className="flex justify-center">
                                        <button
                                            className="mt-3 inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                            onClick={() => void loadMoreRegistrations()}
                                            disabled={loadingMoreRegistrations || loadingRegistrations}
                                        >
                                            {loadingMoreRegistrations ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <RefreshCw className="h-4 w-4" />
                                            )}
                                            {loadingMoreRegistrations ? "Loading more..." : "Load more"}
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        </>
                    ) : (
                        <div className="flex h-full min-h-[320px] items-center justify-center text-sm text-gray-500">
                            Select a trail to see its details.
                        </div>
                    )}
                </Card>
                <Card className="lg:col-span-5 space-y-4 border border-gray-200 shadow-sm p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-lg font-semibold text-gray-800">My organiser activity</h3>
                        <Button
                            variant="ghost"
                            className="border border-gray-200 px-3 py-1 text-xs"
                            onClick={() => void refreshMyData()}
                            disabled={myDataLoading}
                        >
                            {myDataLoading ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <RefreshCw className="h-3 w-3" />
                            )}
                            Refresh
                        </Button>
                    </div>
                    {myDataError ? (
                        <p className="text-sm text-rose-600">{myDataError}</p>
                    ) : null}
                    {myDataLoading && myOrganiserTrails.length === 0 ? (
                        <div className="flex justify-center py-12 text-teal-600">
                            <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-3 md:grid-cols-4">
                                {[
                                    { label: "Created trails", value: organiserActivityStats.total },
                                    { label: "Published", value: organiserActivityStats.published },
                                    { label: "Drafts", value: organiserActivityStats.draft },
                                    { label: "Upcoming", value: organiserActivityStats.upcoming },
                                ].map((stat) => (
                                    <div key={stat.label} className="rounded-xl bg-gray-50 p-4">
                                        <p className="text-xs uppercase tracking-wide text-gray-500">{stat.label}</p>
                                        <p className="mt-1 text-2xl font-semibold text-gray-900">
                                            {myDataLoading ? "…" : stat.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-gray-700">Recently created trails</h4>
                                {recentOrganiserTrails.length === 0 ? (
                                    <p className="text-xs text-gray-500">
                                        {myDataLoading
                                            ? "Loading your organiser activity…"
                                            : "You have not created any trails yet."}
                                    </p>
                                ) : (
                                    <ul className="space-y-3">
                                        {recentOrganiserTrails.map((trail) => (
                                            <li
                                                key={trail.id}
                                                className="rounded-lg border border-gray-200 bg-white px-3 py-3 shadow-sm"
                                            >
                                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                    <div>
                                                        <div className="font-semibold text-gray-900">{trail.title}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {formatDate(trail.starts_at)} · {describeLocation(trail.location)}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {organisationNameById.get(trail.org_id) ?? "Organisation"}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-start gap-2 md:items-end">
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${TRAIL_STATUS_BADGE[trail.status]}`}
                                                        >
                                                            {TRAIL_STATUS_LABEL[trail.status]}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="rounded-md border border-gray-200 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
                                                            onClick={() => handleOpenTrail(trail)}
                                                        >
                                                            Open trail
                                                        </button>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
}
