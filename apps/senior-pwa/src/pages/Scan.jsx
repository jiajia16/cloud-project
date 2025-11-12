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
  Gift,
  History,
  Loader2,
  QrCode,
  RefreshCcw,
  Sparkles,
  Upload,
} from "lucide-react";
import { Button } from "@silvertrails/ui";
import QRScanner from "../components/QRScanner.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
  extractTokenFromScan,
  listMyCheckins,
  scanCheckin,
} from "../services/checkins.js";
import { acceptInvite, previewInvite } from "../services/trails.js";
import { decodeQrFromFile } from "../utils/qrDecode.js";

function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") {
    return null;
  }
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }
  try {
    let segment = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = segment.length % 4;
    if (pad) {
      segment += "=".repeat(4 - pad);
    }
    const decoded = atob(segment);
    return JSON.parse(decoded);
  } catch (err) {
    if (import.meta.env?.DEV) {
      console.debug("[scan] unable to decode token payload", err);
    }
    return null;
  }
}

function formatDateTime(value) {
  if (!value) return "Date unavailable";
  try {
    return new Intl.DateTimeFormat("en-SG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatDateRange(start, end) {
  const startText = start ? formatDateTime(start) : null;
  const endText = end ? formatDateTime(end) : null;
  if (startText && endText) {
    return `${startText} → ${endText}`;
  }
  return startText || endText || "";
}

function shortenId(id) {
  if (!id) return "—";
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
  const [lastInvite, setLastInvite] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const [canLiveScan, setCanLiveScan] = useState(false);
  const fileInputRef = useRef(null);
  const pendingTokenRef = useRef("");

  const isInviteToken = useCallback((token) => {
    const payload = decodeJwtPayload(token);
    return Boolean(
      payload &&
      (payload.scope === "register" || payload.aud === "trail-invite")
    );
  }, []);

  // Probe camera capability once (live scan only when supported)
  useEffect(() => {
    const ok =
      typeof navigator !== "undefined" &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function";
    setCanLiveScan(ok);
  }, []);

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

  const processInviteToken = useCallback(
    async (token) => {
      if (!token) {
        setError("We could not read the QR code. Please try again.");
        return;
      }
      const cleanedToken = typeof token === "string" ? token.trim() : "";
      if (!cleanedToken) {
        setError("We could not read the QR code. Please try again.");
        return;
      }
      if (!accessToken) {
        setError("Please sign in again to use invite codes.");
        return;
      }
      if (loading) return;

      pendingTokenRef.current = cleanedToken;
      setLoading(true);
      setError("");
      setLastCheckin(null);
      try {
        const preview = await previewInvite({
          accessToken,
          token: cleanedToken,
        });
        let alreadyRegistered = false;
        try {
          await acceptInvite({ accessToken, token: cleanedToken });
        } catch (inviteErr) {
          const message = inviteErr?.message ?? "";
          if (/already registered/i.test(message)) {
            alreadyRegistered = true;
          } else {
            throw inviteErr;
          }
        }

        const trailCandidate =
          preview && typeof preview === "object" && preview.trail
            ? preview.trail
            : typeof preview === "object"
              ? preview
              : null;
        const trailTitle =
          trailCandidate?.title ??
          (typeof preview?.title === "string" ? preview.title : "");
        const organisationName =
          trailCandidate?.organisation?.name ??
          preview?.organisation?.name ??
          trailCandidate?.organisation_name ??
          "";
        const startsAt =
          trailCandidate?.starts_at ?? preview?.starts_at ?? undefined;
        const endsAt =
          trailCandidate?.ends_at ?? preview?.ends_at ?? undefined;

        setLastInvite({
          status: alreadyRegistered ? "already" : "success",
          trailTitle,
          organisationName,
          startsAt,
          endsAt,
        });
        setManualToken("");
        pendingTokenRef.current = "";
      } catch (err) {
        pendingTokenRef.current = "";
        setError(
          err?.message ??
          "We couldn't process this invite. Please try again or ask your organiser for a new code."
        );
      } finally {
        setLoading(false);
      }
    },
    [accessToken, loading]
  );

  const submitToken = useCallback(
    async (token, metadata = null) => {
      if (!token) {
        setError("We could not read the QR code. Please try again.");
        return;
      }
      const cleanedToken = typeof token === "string" ? token.trim() : "";
      if (!cleanedToken) {
        setError("We could not read the QR code. Please try again.");
        return;
      }
      if (isInviteToken(cleanedToken)) {
        return processInviteToken(cleanedToken);
      }
      if (!accessToken) {
        setError("Please sign in again to scan QR codes.");
        return;
      }
      if (pendingOrgAssignment) {
        setError("Join an organisation before scanning QR codes.");
        return;
      }
      if (loading) return;

      pendingTokenRef.current = cleanedToken;
      setLoading(true);
      setError("");
      setLastInvite(null);
      try {
        const record = await scanCheckin({
          accessToken,
          token: cleanedToken,
          activityId: metadata?.activityId,
          activityOrder: metadata?.activityOrder,
          points: metadata?.points,
        });
        setLastCheckin(record);
        setManualToken("");
        pendingTokenRef.current = "";
        fetchHistory().catch(() => { });
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
    [
      accessToken,
      fetchHistory,
      isInviteToken,
      loading,
      pendingOrgAssignment,
      processInviteToken,
    ]
  );

  const onUpload = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setError("");
      setLoading(true);
      try {
        const decodedText = await decodeQrFromFile(file);
        const parsed = extractTokenFromScan(decodedText, { withMetadata: true });
        if (parsed?.kind === "invite") {
          await processInviteToken(parsed.token);
          return;
        }
        const token = parsed && typeof parsed === "object" ? parsed.token : parsed;
        if (!token) throw new Error("No QR token found in the image.");
        await submitToken(token, parsed?.metadata ?? null);
      } catch (err) {
        setError(
          err?.message || "Unable to read this QR image. Try another image."
        );
      } finally {
        setLoading(false);
        e.target.value = ""; // allow re-select of the same file
      }
    },
    [processInviteToken, submitToken]
  );

  const handleScanResult = useCallback(
    (rawValue) => {
      if (loading || lastCheckin || lastInvite) return;
      const parsed = extractTokenFromScan(rawValue, { withMetadata: true });
      const token = parsed && typeof parsed === "object" ? parsed.token : parsed;
      if (!token) {
        setError("We could not read the QR code. Please try again.");
        return;
      }
      if (pendingTokenRef.current && pendingTokenRef.current === token) return;
      if (parsed?.kind === "invite" || isInviteToken(token)) {
        processInviteToken(token);
        return;
      }
  submitToken(token, parsed?.metadata ?? null);
    },
    [isInviteToken, lastCheckin, lastInvite, loading, processInviteToken, submitToken]
  );

  const handleManualSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const parsed = extractTokenFromScan(manualToken, { withMetadata: true });
      const token = parsed && typeof parsed === "object" ? parsed.token : parsed;
      if (!token) {
        setError("Enter a valid invite or check-in code first.");
        return;
      }
      if (parsed?.kind === "invite" || isInviteToken(token)) {
        await processInviteToken(token);
        return;
      }
      await submitToken(token, parsed?.metadata ?? null);
    },
    [isInviteToken, manualToken, processInviteToken, submitToken]
  );

  const handleBackHome = useCallback(() => {
    navigate("/home");
  }, [navigate]);

  const resetScanner = useCallback(() => {
    setLastCheckin(null);
    setLastInvite(null);
    setManualToken("");
    setError("");
    pendingTokenRef.current = "";
  }, []);

  const recentHistory = useMemo(() => history.slice(0, 5), [history]);
  const hasHistory = recentHistory.length > 0;
  const showSuccess = Boolean(lastCheckin || lastInvite);
  const awardedPoints = useMemo(() => {
    if (!lastCheckin) {
      return null;
    }
    const raw =
      lastCheckin.points_awarded ??
      (typeof lastCheckin.points_awarded === "number"
        ? lastCheckin.points_awarded
        : null);
    if (raw === null || raw === undefined) {
      return null;
    }
    const numeric = Number(raw);
    return Number.isFinite(numeric) ? numeric : null;
  }, [lastCheckin]);
  const hasPointsInfo = typeof awardedPoints === "number";
  const positivePoints = hasPointsInfo && Number(awardedPoints) > 0;
  const zeroPoints = hasPointsInfo && Number(awardedPoints) === 0;
  const isRepeatCheckin = Boolean(lastCheckin && lastCheckin.new_activity === false);
  const activityStepLabel = useMemo(() => {
    if (!lastCheckin?.activity_order) {
      return null;
    }
    const order = Number(lastCheckin.activity_order);
    return Number.isFinite(order) ? `Activity step ${order}` : null;
  }, [lastCheckin]);
  const checkinStatusDescription = useMemo(() => {
    if (!lastCheckin) {
      return "";
    }
    if (isRepeatCheckin || zeroPoints) {
      return "Looks like you've already completed this activity. We've saved your attendance, but no extra points were added.";
    }
    if (positivePoints) {
      return "Great job! These points are now in your balance. Check Rewards to see what you can redeem.";
    }
    if (hasPointsInfo) {
      return "We recorded your activity. Points will appear once the organiser confirms attendance.";
    }
    return "Your activity has been recorded. Points will appear once the organiser confirms your attendance.";
  }, [hasPointsInfo, isRepeatCheckin, lastCheckin, positivePoints, zeroPoints]);
  const pointsHeadline = useMemo(() => {
    if (!hasPointsInfo || awardedPoints === null) {
      return "";
    }
    if (positivePoints) {
      return `+${Number(awardedPoints)}`;
    }
    if (zeroPoints || isRepeatCheckin) {
      return "Already counted";
    }
    return String(awardedPoints);
  }, [awardedPoints, hasPointsInfo, isRepeatCheckin, positivePoints, zeroPoints]);
  const pointsSubtext = useMemo(() => {
    if (!hasPointsInfo || awardedPoints === null) {
      return "";
    }
    if (positivePoints) {
      return "Added instantly to your balance.";
    }
    if (zeroPoints || isRepeatCheckin) {
      return "No extra points were added this time.";
    }
    return "We'll reflect any points once the organiser confirms attendance.";
  }, [awardedPoints, hasPointsInfo, isRepeatCheckin, positivePoints, zeroPoints]);

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
            <h1 className="text-xl font-semibold">
              You need an organisation first
            </h1>
          </div>
          <p className="text-sm leading-6 text-gray-600">
            We can only record check-ins after your organiser adds you to an
            organisation. Enter the invite link they shared with you or ask them
            to send a new one.
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
      className={`min-h-[100svh] flex flex-col items-center px-4 py-8 transition-colors duration-500 ${showSuccess ? "bg-gradient-to-b from-white to-cyan-50" : "bg-teal-800"
        }`}
    >
      {!showSuccess && (
        <button
          type="button"
          onClick={handleBackHome}
          className="self-start mb-6 flex items-center gap-2 text-white/90 hover:text-white transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
      )}

      {showSuccess ? (
        lastInvite ? (
          <div className="w-full max-w-md text-center flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-4 bg-white/90 backdrop-blur-sm rounded-3xl px-6 py-10 shadow-xl">
              <div className="bg-teal-100 rounded-full p-5 shadow">
                <CheckCircle className="w-16 h-16 text-teal-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {lastInvite.status === "already"
                    ? "You're already registered"
                    : "Invite accepted!"}
                </h2>
                {lastInvite.trailTitle ? (
                  <p className="text-gray-600 mt-2">{lastInvite.trailTitle}</p>
                ) : null}
                {lastInvite.organisationName ? (
                  <p className="text-sm text-gray-500 mt-1">
                    {lastInvite.organisationName}
                  </p>
                ) : null}
              </div>
              {formatDateRange(lastInvite.startsAt, lastInvite.endsAt) ? (
                <div className="text-sm text-gray-600 bg-gray-100 rounded-2xl px-4 py-3 text-left w-full">
                  <p className="font-semibold text-gray-700">Schedule</p>
                  <p className="mt-1">
                    {formatDateRange(lastInvite.startsAt, lastInvite.endsAt)}
                  </p>
                </div>
              ) : null}
              <p className="text-sm text-gray-500">
                {lastInvite.status === "already"
                  ? "You're all set. Check My Trails to see your upcoming activities."
                  : "You're registered! We'll remind you in My Trails before the activity starts."}
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
                onClick={() => navigate("/mytrails")}
                className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-base py-3"
              >
                View My Trails
              </Button>
            </div>
            <Button
              onClick={resetScanner}
              className="w-full bg-white/80 border border-teal-200 text-teal-700 hover:bg-white text-base py-3"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Scan another code
            </Button>
          </div>
        ) : (
          <div className="w-full max-w-md text-center flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-5 bg-white/90 backdrop-blur-sm rounded-3xl px-6 py-10 shadow-xl w-full">
              <div className="bg-green-100 rounded-full p-5 shadow">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-gray-800">
                  Check-in successful!
                </h2>
                <p className="text-sm text-gray-600">
                  {formatDateTime(lastCheckin.checked_at)}
                </p>
              </div>

              {hasPointsInfo ? (
                <div
                  className={`w-full rounded-2xl px-4 py-4 transition-all ${
                    positivePoints
                      ? "bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-white shadow-lg"
                      : "bg-gray-100 border border-gray-200 text-gray-700"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`rounded-full p-2 ${
                        positivePoints ? "bg-white/20" : "bg-white"
                      }`}
                    >
                      <Sparkles
                        className={`w-5 h-5 ${
                          positivePoints ? "text-white" : "text-teal-600"
                        }`}
                      />
                    </div>
                    <div className="text-left flex-1">
                      <p
                        className={`text-xs font-semibold uppercase tracking-wide ${
                          positivePoints ? "text-white/80" : "text-gray-500"
                        }`}
                      >
                        Points awarded
                      </p>
                      <p
                        className={`text-3xl font-bold leading-tight ${
                          positivePoints ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {pointsHeadline}
                      </p>
                      {pointsSubtext ? (
                        <p
                          className={`mt-1 text-sm ${
                            positivePoints ? "text-white/90" : "text-gray-600"
                          }`}
                        >
                          {pointsSubtext}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="text-sm text-gray-600 bg-gray-100 rounded-2xl px-4 py-3 text-left w-full">
                {activityStepLabel ? (
                  <p>
                    <span className="font-semibold text-gray-700">Activity:</span>{" "}
                    {activityStepLabel}
                  </p>
                ) : null}
                <p className={activityStepLabel ? "mt-1" : undefined}>
                  <span className="font-semibold text-gray-700">Trail:</span>{" "}
                  {shortenId(lastCheckin.trail_id)}
                </p>
                <p className="mt-1">
                  <span className="font-semibold text-gray-700">
                    Organisation:
                  </span>{" "}
                  {shortenId(lastCheckin.org_id)}
                </p>
                <p className="mt-1">
                  <span className="font-semibold text-gray-700">Method:</span>{" "}
                  {lastCheckin.method}
                </p>
              </div>

              {checkinStatusDescription ? (
                <p className="text-sm text-gray-500">{checkinStatusDescription}</p>
              ) : null}
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

            {positivePoints ? (
              <Button
                onClick={() => navigate("/rewards")}
                className="w-full bg-amber-100 border border-amber-200 text-amber-900 hover:bg-amber-200 text-base py-3 flex items-center justify-center gap-2"
              >
                <Gift className="w-4 h-4" />
                See what you can redeem
              </Button>
            ) : null}

            <Button
              onClick={() => {
                resetScanner();
                fetchHistory().catch(() => { });
              }}
              className="w-full bg-white/80 border border-teal-200 text-teal-700 hover:bg-white text-base py-3 flex items-center justify-center gap-2"
            >
              <History className="w-4 h-4" />
              View recent check-ins
            </Button>
          </div>
        )
      ) : (
        <div className="w-full max-w-md flex flex-col gap-6 items-center">
          {/* Scan / Upload card */}
          <div className="w-full bg-white/95 backdrop-blur-sm rounded-3xl px-6 py-6 shadow-xl">
            <div className="flex items-center gap-3 text-teal-700">
              <QrCode className="w-6 h-6" />
              <h2 className="text-xl font-semibold">Scan QR to mark activity</h2>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Hold your device steady and position the QR code inside the frame.
              We will record your check-in automatically.
            </p>

            {canLiveScan ? (
              <QRScanner
                onResult={handleScanResult}
                onUnavailable={() => setCanLiveScan(false)}   // <-- auto fallback
                className="mt-5"
              />
            ) : (
              <div className="mt-5 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 sm:p-8">
                <div className="mx-auto max-w-md flex flex-col items-center text-center space-y-2">
                  <Upload className="w-6 h-6 text-teal-600 mb-1" />
                  <h3 className="font-semibold text-gray-800 text-sm">
                    Upload a QR code image
                  </h3>
                  <p className="text-xs text-gray-600">
                    PNG or JPG works best. We’ll read the code and submit automatically.
                  </p>
                  <div className="pt-3">
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      variant="positive"
                      className="px-4 py-2 text-sm"
                      disabled={loading}
                    >
                      Choose Image
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={onUpload}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {/* Messages below the scanner/upload area for clean spacing */}
            {loading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-teal-700 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing your code...
              </div>
            )}
            {error && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 text-rose-600 px-3 py-2 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Manual entry card */}
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

          {/* History card */}
          <div className="w-full bg-white/95 backdrop-blur-sm rounded-3xl px-6 py-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                <Clock className="w-5 h-5 text-teal-600" />
                Recent check-ins
              </h3>
              <button
                type="button"
                onClick={() => fetchHistory().catch(() => { })}
                className="flex items-center gap-1 text-sm text-teal-700 hover:text-teal-900"
              >
                <RefreshCcw
                  className={`w-4 h-4 ${historyLoading ? "animate-spin" : ""}`}
                />
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
                You have not checked in to any trails yet. Scan a QR code to get
                started!
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
