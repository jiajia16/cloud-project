import React from "react";
import {
    Home,
    Map,
    Camera,
    Trophy,
    Gift,
    Users,
} from "lucide-react";

import { Link, useLocation } from "react-router-dom";

const items = [
    { to: "/home", label: "Home", icon: <Home className="w-6 h-6" /> },
    { to: "/mytrails", label: "Trails", icon: <Map className="w-6 h-6" /> },
    { to: "/scan", label: "Scan", icon: <Camera className="w-6 h-6" /> },
    { to: "/leaderboard", label: "Leaders", icon: <Trophy className="w-6 h-6" /> },
    { to: "/rewards", label: "Rewards", icon: <Gift className="w-6 h-6" /> },
    { to: "/social", label: "Community", icon: <Users className="w-6 h-6" /> },
];

export function BottomNav() {
    const { pathname } = useLocation();

    return (
        <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-t border-gray-200 shadow-md">
            <div className="max-w-screen-sm mx-auto">
                {/* distribute items horizontally with equal spacing */}
                <ul className="flex justify-between items-center px-8 py-3">
                    {items.map((it) => {
                        const active = pathname === it.to;
                        return (
                            <li key={it.to} className="flex-1 text-center">
                                <Link
                                    to={it.to}
                                    className={`flex flex-col items-center justify-center text-sm transition-transform duration-150 ${active
                                        ? "text-teal-600 scale-110 font-semibold"
                                        : "text-gray-600 hover:scale-105"
                                        }`}
                                >
                                    <span className="text-2xl mb-1">{it.icon}</span>
                                    <span className="text-xs">{it.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </nav>
    );
}
