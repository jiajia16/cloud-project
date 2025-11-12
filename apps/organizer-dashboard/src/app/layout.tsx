"use client";

import "./globals.css";
import { Button } from "@silvertrails/ui";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "../context/AuthContext";
import {
  OrganisationProvider,
  useOrganisation,
} from "../context/OrganisationContext";

const PUBLIC_PATHS = new Set(["/login", "/organisations"]);

function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const {
    organisationId,
    selectOrganisation,
    organisations,
    loading: organisationsLoading,
    activeOrganisation,
  } = useOrganisation();
  const [mounted, setMounted] = useState(false);
  const logoutRef = useRef(logout);
  logoutRef.current = logout;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }
    const isPublicPath = PUBLIC_PATHS.has(pathname ?? "");
    if (!isAuthenticated && !isPublicPath) {
      router.replace("/login");
    } else if (isAuthenticated && pathname === "/login") {
      router.replace("/");
    }
  }, [mounted, isAuthenticated, pathname, router]);

  const tabs = useMemo(
    () => [
      { label: "Overview", href: "/" },
      { label: "Manage Trails", href: "/manageTrails" },
      { label: "Organisations", href: "/organisations" },
      { label: "Participants", href: "/participants" },
      { label: "Points", href: "/points" },
      { label: "Rewards", href: "/rewards" },
      { label: "Reports", href: "/reports" },
      { label: "Insights", href: "/insights" },
    ],
    []
  );

  const showNavigation = mounted && isAuthenticated && pathname !== "/login";
  const isPublicPath = PUBLIC_PATHS.has(pathname ?? "");

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[#f7fbfb] text-gray-900">
        {showNavigation && (
          <>
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
              <div className="max-w-screen-lg mx-auto flex justify-between items-center p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center text-white font-bold">
                    ST
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold">SilverTrails Admin</h1>
                    {user ? (
                      <p className="text-xs text-gray-500">
                        Signed in as {user.name} ({user.role})
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {organisations.length ? (
                    <label className="flex flex-col text-xs text-gray-500 uppercase">
                      Organisation
                      <select
                        className="mt-1 min-w-[180px] rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-200"
                        value={organisationId ?? ""}
                        onChange={(event) =>
                          selectOrganisation(event.target.value || null)
                        }
                      >
                        {organisations.map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <div className="text-xs text-gray-500">
                      {organisationsLoading
                        ? "Loading organisations…"
                        : "No organisation linked."}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="bg-white text-teal-600 hover:bg-teal-50"
                    onClick={() => {
                      void logoutRef.current();
                    }}
                  >
                    Sign out
                  </Button>
                </div>
              </div>
            </header>

            <section className="max-w-screen-lg mx-auto px-4 pt-5">
              <div className="rounded-2xl p-6 bg-gradient-to-r from-teal-400 to-cyan-400 text-white shadow">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold">Admin Dashboard</h2>
                    <p className="text-white/90">
                      {activeOrganisation
                        ? `Focused on ${activeOrganisation.name}. Manage activities and monitor community engagement.`
                        : "Manage activities and monitor community engagement"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="bg-white text-teal-600 hover:bg-teal-50"
                    asChild
                  >
                    <Link href="/manageTrails">+ Create New Trail</Link>
                  </Button>
                </div>
              </div>
            </section>

            <nav className="max-w-screen-lg mx-auto px-6 pt-6 pb-4">
              <div className="flex flex-wrap justify-start gap-3">
                {tabs.map((tab) => {
                  const active = pathname === tab.href;
                  return (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      className={`px-6 py-2 rounded-md text-sm font-medium border shadow-sm transition-all duration-200 ${
                        active
                          ? "bg-teal-500 text-white border-teal-500 shadow-md"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {tab.label}
                    </Link>
                  );
                })}
              </div>
            </nav>
          </>
        )}

        <main className="max-w-screen-lg mx-auto px-4 pb-10" suppressHydrationWarning>
          {isPublicPath || isAuthenticated ? children : null}
        </main>
      </body>
    </html>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <OrganisationProvider>
        <Shell>{children}</Shell>
      </OrganisationProvider>
    </AuthProvider>
  );
}
