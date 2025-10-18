"use client";

import "./globals.css";
import { Button } from "@silvertrails/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { label: "Overview", href: "/" },
    { label: "Manage Trails", href: "/manageTrails" },
    { label: "Participants", href: "/participants" },
    { label: "Reports", href: "/reports" },
    { label: "Insights", href: "/insights" },
  ];

  return (
    <html lang="en">
      <body className="bg-[#f7fbfb] text-gray-900">
        {/* Top header */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
          <div className="max-w-screen-lg mx-auto flex justify-between items-center p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center text-white font-bold">ST</div>
              <h1 className="text-xl font-semibold">SilverTrails Admin</h1>
            </div>
            <div className="text-sm bg-teal-50 px-3 py-1 rounded-full">
              Community Center Staff
            </div>
          </div>
        </header>

        {/* Banner (card-like) */}
        <section className="max-w-screen-lg mx-auto px-4 pt-5">
          <div className="rounded-2xl p-6 bg-gradient-to-r from-teal-400 to-cyan-400 text-white shadow">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Admin Dashboard</h2>
                <p className="text-white/90">Manage activities and monitor community engagement</p>
              </div>
              <Button variant="outline" className="bg-white text-teal-600 hover:bg-teal-50">
                <Link href="/newtrails">+ Create New Trail</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Tabs row (only here) */}
        <nav className="max-w-screen-lg mx-auto px-6 pt-6 pb-4">
          <div className="flex flex-wrap justify-start gap-3">
            {tabs.map((tab) => {
              const active = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`px-6 py-2 rounded-md text-sm font-medium border shadow-sm transition-all duration-200 ${active
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


        {/* Page content */}
        <main className="max-w-screen-lg mx-auto px-4 pb-10">{children}</main>
      </body>
    </html>
  );
}
