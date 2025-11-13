"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card } from "@silvertrails/ui";
import {
  assignParticipantToOrganisation,
  createOrganisation,
  listOrganisations,
  type OrganisationSummary,
} from "../../services/auth";
import { useAuth } from "../../context/AuthContext";
import { useOrganisation } from "../../context/OrganisationContext";

export default function OrganisationsPage() {
  const { isAuthenticated, tokens, user, refreshProfile, login, addOrganisationMembership } =
    useAuth();
  const { refreshOrganisations, selectOrganisation } = useOrganisation();

  const [name, setName] = useState("");
  const [nric, setNric] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState<string | null>(null);

  const [organisationName, setOrganisationName] = useState("");
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgError, setOrgError] = useState<string | null>(null);
  const [orgSuccess, setOrgSuccess] = useState<string | null>(null);
  const [orgs, setOrgs] = useState<OrganisationSummary[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [orgsError, setOrgsError] = useState<string | null>(null);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const accessToken = tokens?.access_token;
    if (!accessToken || !isAuthenticated) {
      setOrgs([]);
      setOrgsError(null);
      return () => {
        cancelled = true;
      };
    }
    setOrgsLoading(true);
    setOrgsError(null);
    listOrganisations({ accessToken })
      .then((items) => {
        if (!cancelled) {
          setOrgs(items);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message =
            error instanceof Error
              ? error.message
              : "Unable to load organisations.";
          setOrgsError(message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setOrgsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, tokens?.access_token]);

  useEffect(() => {
    if (!isAuthenticated) {
      setSelectedOrg("");
      return;
    }
    if (orgs.length === 0) {
      setSelectedOrg("");
      return;
    }
    if (!selectedOrg || !orgs.some((organisation) => organisation.id === selectedOrg)) {
      setSelectedOrg(orgs[0].id);
    }
  }, [isAuthenticated, orgs, selectedOrg]);

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSignupError(null);
    setSignupSuccess(null);

    if (password !== confirmPassword) {
      setSignupError("Passwords do not match.");
      return;
    }

    setSignupLoading(true);
    try {
      const response = await fetch("/api/organiser-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          nric,
          username,
          password,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        const message = payload?.message ?? "Unable to create organiser account.";
        throw new Error(message);
      }

      setSignupSuccess(
        payload?.message ?? "Organiser account created. Signing you in now..."
      );

      await login(username, password);

      setSignupSuccess("Account created and you're now signed in. Pick an organisation below.");
      setName("");
      setNric("");
      setUsername("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "We ran into a problem creating your organiser account.";
      setSignupError(message);
    } finally {
      setSignupLoading(false);
    }
  };

  const handleCreateOrganisation = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setOrgError(null);
    setOrgSuccess(null);

    const accessToken = tokens?.access_token;
    if (!accessToken) {
      setOrgError("Sign in first to create an organisation.");
      return;
    }

    const trimmedName = organisationName.trim();
    if (!trimmedName) {
      setOrgError("Organisation name is required.");
      return;
    }

    setOrgLoading(true);
    try {
      const organisation = await createOrganisation({
        accessToken,
        name: trimmedName,
      });
      setOrgSuccess(
        `Created ${organisation.name}. You're ready to start organising activities.`
      );
      setOrganisationName("");
      setOrgs((prev) => {
        const exists = prev.some((item) => item.id === organisation.id);
        return exists ? prev : [...prev, organisation];
      });
      setSelectedOrg(organisation.id);
      await refreshProfile();
      await refreshOrganisations();
      addOrganisationMembership(organisation.id);
      selectOrganisation(organisation.id);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to create that organisation right now.";
      setOrgError(message);
    } finally {
      setOrgLoading(false);
    }
  };

  const handleJoinOrganisation = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setJoinError(null);
    setJoinSuccess(null);

    const accessToken = tokens?.access_token;
    if (!accessToken || !user) {
      setJoinError("Sign in first to join an organisation.");
      return;
    }
    if (!selectedOrg) {
      setJoinError("Select an organisation from the list.");
      return;
    }

    setJoinLoading(true);
    try {
      await assignParticipantToOrganisation({
        accessToken,
        orgId: selectedOrg,
        userId: user.id,
      });
      setJoinSuccess("You're now part of this organisation.");
      await refreshProfile();
      await refreshOrganisations();
      addOrganisationMembership(selectedOrg);
      selectOrganisation(selectedOrg);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to join that organisation right now.";
      setJoinError(message);
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-10">
      {!isAuthenticated ? (
        <Card className="p-8 space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-teal-600">
              Create an organiser account
            </h1>
            <p className="text-sm text-gray-600">
              Fill in the details below to create your organiser login. We'll sign you in
              immediately so you can pick an organisation to join.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSignup}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">NRIC / Identifier</label>
              <input
                type="text"
                value={nric}
                onChange={(event) => setNric(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Confirm password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                  required
                />
              </div>
            </div>

            {signupError && (
              <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                {signupError}
              </p>
            )}
            {signupSuccess && (
              <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                {signupSuccess}
              </p>
            )}

            <Button
              type="submit"
              className="w-full bg-teal-500 hover:bg-teal-600 text-white"
              disabled={signupLoading}
            >
              {signupLoading ? "Creating account..." : "Create organiser account"}
            </Button>
          </form>

          <p className="text-xs text-gray-500">
            Already have an organiser login?{" "}
            <Link
              href="/login"
              className="text-teal-600 hover:text-teal-700 font-medium"
            >
              Sign in instead
            </Link>
            .
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          <Card className="p-6 space-y-3">
            <div className="space-y-1">
              <h1 className="text-xl font-semibold text-teal-600">
                Hi {user?.name ?? "organiser"}
              </h1>
              <p className="text-sm text-gray-600">
                Choose an existing organisation to join, or create a new one for your
                community.
              </p>
            </div>
            {user?.org_ids?.length ? (
              <p className="text-xs text-gray-500">
                You're already linked to {user.org_ids.length} organisation
                {user.org_ids.length > 1 ? "s" : ""}. Joining another one is fine if you help
                multiple groups.
              </p>
            ) : null}
          </Card>

          <Card className="p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-gray-800">Create a new organisation</h2>
              <p className="text-sm text-gray-600">
                Set up a fresh organisation. We'll automatically add you as its organiser.
              </p>
            </div>
            <form className="space-y-4" onSubmit={handleCreateOrganisation}>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Organisation name
                </label>
                <input
                  type="text"
                  value={organisationName}
                  onChange={(event) => setOrganisationName(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                  placeholder="e.g. Sunshine Activity Club"
                  required
                />
              </div>

              {orgError && (
                <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                  {orgError}
                </p>
              )}
              {orgSuccess && (
                <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                  {orgSuccess}
                </p>
              )}

              <Button
                type="submit"
                className="w-full bg-teal-500 hover:bg-teal-600 text-white"
                disabled={orgLoading}
              >
                {orgLoading ? "Creating organisation..." : "Create organisation"}
              </Button>
            </form>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-gray-800">
                Join an existing organisation
              </h2>
              <p className="text-sm text-gray-600">
                Pick the organisation you work with to gain access to its dashboards.
              </p>
            </div>

            {orgsLoading ? (
              <p className="text-sm text-gray-500">Loading organisations...</p>
            ) : orgsError ? (
              <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                {orgsError}
              </p>
            ) : orgs.length === 0 ? (
              <p className="text-sm text-gray-500">
                No organisations available yet. Create one above to get started.
              </p>
            ) : (
              <form className="space-y-4" onSubmit={handleJoinOrganisation}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Organisation</label>
                  <select
                    value={selectedOrg}
                    onChange={(event) => setSelectedOrg(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                    required
                  >
                    <option value="" disabled>
                      Select an organisation
                    </option>
                    {orgs
                      .slice()
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((organisation) => (
                        <option key={organisation.id} value={organisation.id}>
                          {organisation.name}
                        </option>
                      ))}
                  </select>
                </div>

                {joinError && (
                  <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                    {joinError}
                  </p>
                )}
                {joinSuccess && (
                  <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                    {joinSuccess}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white"
                  disabled={joinLoading}
                >
                  {joinLoading ? "Joining organisation..." : "Join organisation"}
                </Button>
              </form>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
