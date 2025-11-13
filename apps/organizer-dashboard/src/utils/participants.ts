import type { UserSummary } from "../services/auth";

export function formatShortId(userId: string | null | undefined): string {
  if (!userId) {
    return "";
  }
  if (userId.length <= 12) {
    return userId.toUpperCase();
  }
  return `${userId.slice(0, 8).toUpperCase()}…${userId.slice(-4).toUpperCase()}`;
}

export type ParticipantIdentity = {
  name: string;
  nric: string | null;
  shortId: string;
};

export function resolveParticipantIdentity(
  profile: Pick<UserSummary, "id" | "name" | "nric"> | undefined | null,
  fallbackUserId: string,
): ParticipantIdentity {
  const shortId = formatShortId(profile?.id ?? fallbackUserId);
  const displayName =
    (profile?.name && profile.name.trim()) ||
    shortId ||
    fallbackUserId.toUpperCase();
  const nric = profile?.nric?.trim() || null;
  return {
    name: displayName,
    nric,
    shortId,
  };
}

export function formatParticipantIdentity(
  profile: Pick<UserSummary, "id" | "name" | "nric"> | undefined | null,
  fallbackUserId: string,
): string {
  const identity = resolveParticipantIdentity(profile, fallbackUserId);
  return [identity.name, identity.nric, identity.shortId]
    .filter(Boolean)
    .join(" · ");
}
