"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  listOrganisations,
  type OrganisationSummary,
} from "../services/auth";
import { useAuth } from "./AuthContext";

type OrganisationContextValue = {
  organisationId: string | null;
  selectOrganisation: (organisationId: string | null) => void;
  organisations: OrganisationSummary[];
  activeOrganisation: OrganisationSummary | null;
  loading: boolean;
  error: string | null;
  refreshOrganisations: () => Promise<void>;
};

const OrganisationContext = createContext<OrganisationContextValue | undefined>(
  undefined,
);

const STORAGE_PREFIX = "organiser-selected-org";

const EMPTY_ORG_IDS: string[] = [];

function buildStorageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`;
}

function fallbackOrganisations(ids: string[]): OrganisationSummary[] {
  return ids.map((id) => ({
    id,
    name: id.slice(0, 8).toUpperCase(),
  }));
}

function normaliseError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unable to load organisations.";
}

export function OrganisationProvider({ children }: { children: ReactNode }) {
  const { tokens, user, isAuthenticated } = useAuth();
  const accessToken = tokens?.access_token ?? null;
  const organiserOrgIds = user?.org_ids ?? EMPTY_ORG_IDS;
  const organiserOrgKey = organiserOrgIds.join("|");
  const stableOrganiserOrgIds = useMemo(() => organiserOrgIds, [organiserOrgKey]);
  const userId = user?.id ?? null;

  const [organisationId, setOrganisationId] = useState<string | null>(null);
  const [organisations, setOrganisations] = useState<OrganisationSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshOrganisations = useCallback(async () => {
    if (!accessToken || !isAuthenticated) {
      setOrganisations((prev) => (prev.length ? [] : prev));
      setError((prev) => (prev ? null : prev));
      return;
    }
    if (!stableOrganiserOrgIds.length) {
      setOrganisations((prev) => (prev.length ? [] : prev));
      setError((prev) => (prev ? null : prev));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const list = await listOrganisations({ accessToken });
      const filtered = list.filter((org) => stableOrganiserOrgIds.includes(org.id));
      const sorted = filtered.sort((a, b) => a.name.localeCompare(b.name));
      setOrganisations(
        sorted.length ? sorted : fallbackOrganisations(stableOrganiserOrgIds),
      );
    } catch (err) {
      setError(normaliseError(err));
      setOrganisations((prev) => {
        if (prev.length) {
          return prev;
        }
        return fallbackOrganisations(stableOrganiserOrgIds);
      });
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated, organiserOrgKey, stableOrganiserOrgIds]);

  useEffect(() => {
    if (!accessToken || !isAuthenticated || !stableOrganiserOrgIds.length) {
      if (!stableOrganiserOrgIds.length) {
        setOrganisations((prev) => (prev.length ? [] : prev));
        setOrganisationId((prev) => (prev === null ? prev : null));
      }
      return;
    }
    void refreshOrganisations();
  }, [
    accessToken,
    isAuthenticated,
    organiserOrgKey,
    refreshOrganisations,
    stableOrganiserOrgIds.length,
  ]);

  useEffect(() => {
    if (!stableOrganiserOrgIds.length) {
      setOrganisationId((prev) => (prev === null ? prev : null));
      return;
    }

    setOrganisationId((current) => {
      if (current && stableOrganiserOrgIds.includes(current)) {
        return current;
      }
      let stored: string | null = null;
      if (typeof window !== "undefined" && userId) {
        stored = window.localStorage.getItem(buildStorageKey(userId));
      }
      if (stored && stableOrganiserOrgIds.includes(stored)) {
        return stored;
      }
      return stableOrganiserOrgIds[0];
    });
  }, [organiserOrgKey, stableOrganiserOrgIds, userId]);

  useEffect(() => {
    if (typeof window === "undefined" || !userId) {
      return;
    }
    const key = buildStorageKey(userId);
    if (organisationId) {
      window.localStorage.setItem(key, organisationId);
    } else {
      window.localStorage.removeItem(key);
    }
  }, [organisationId, userId]);

  const selectOrganisation = useCallback(
    (nextId: string | null) => {
      if (!nextId) {
        setOrganisationId(null);
        return;
      }
      if (stableOrganiserOrgIds.length && !stableOrganiserOrgIds.includes(nextId)) {
        return;
      }
      setOrganisationId(nextId);
    },
    [stableOrganiserOrgIds],
  );

  const activeOrganisation = useMemo(() => {
    if (!organisationId) {
      return null;
    }
    return organisations.find((org) => org.id === organisationId) ?? null;
  }, [organisationId, organisations]);

  const value = useMemo<OrganisationContextValue>(
    () => ({
      organisationId,
      selectOrganisation,
      organisations,
      activeOrganisation,
      loading,
      error,
      refreshOrganisations,
    }),
    [
      organisationId,
      selectOrganisation,
      organisations,
      activeOrganisation,
      loading,
      error,
      refreshOrganisations,
    ],
  );

  return (
    <OrganisationContext.Provider value={value}>
      {children}
    </OrganisationContext.Provider>
  );
}

export function useOrganisation() {
  const ctx = useContext(OrganisationContext);
  if (!ctx) {
    throw new Error("useOrganisation must be used inside OrganisationProvider");
  }
  return ctx;
}
