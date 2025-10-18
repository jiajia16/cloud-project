import React from "react";
import { BottomNav } from "../../../../packages/ui/lib/BottomNav";

export default function Layout({ children, title = "SilverTrails" }) {
    return (
        <div className="min-h-[100svh] bg-gray-50 pb-20">
            <header className="sticky top-0 z-40 bg-gradient-to-r from-teal-400 to-cyan-400 text-white p-4">
                <div className="max-w-screen-sm mx-auto">
                    <h1 className="text-2xl font-bold">{title}</h1>
                </div>
            </header>

            <main className="max-w-screen-sm mx-auto p-4">{children}</main>

            <BottomNav />
        </div>
    );
}
