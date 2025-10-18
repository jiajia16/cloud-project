import React from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import {
    Trophy,
    Gift,
    Calendar,
    BookOpen,
    LogOut,
    Globe,
    User,
    Lightbulb,
} from "lucide-react";

export default function Home() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const highlights = [
        {
            title: "Seniors Tai Chi",
            subtitle: "Morning Tai Chi",
            desc: "Join Uncle Lim and friends every Tuesday",
            color: "bg-cyan-300",
        },
        {
            title: "Cooking Class",
            subtitle: "Cooking Workshop",
            desc: "Learn traditional recipes together",
            color: "bg-orange-300",
        },
        {
            title: "Garden Club",
            subtitle: "Garden Club",
            desc: "Grow herbs and vegetables together",
            color: "bg-cyan-300",
        },
    ];

    return (
        <div className="min-h-screen bg-cyan-50 flex flex-col items-center py-6 font-sans">
            {/* Header */}
            <div className="w-full max-w-3xl flex justify-between items-center px-6 py-3 bg-white rounded-2xl shadow-sm">
                <h1 className="text-xl font-bold text-cyan-700">SilverTrails</h1>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-1 text-sm bg-cyan-100 px-3 py-1 rounded-xl">
                        <Globe className="w-4 h-4" /> 中文
                    </button>
                    <button
                        className="flex items-center justify-center w-8 h-8 bg-cyan-100 rounded-full hover:bg-cyan-200"
                        onClick={logout}
                    >
                        <User className="w-5 h-5 text-cyan-700" />
                    </button>
                </div>
            </div>

            {/* Welcome Banner */}
            <div className="w-full max-w-3xl mt-6 bg-gradient-to-r from-cyan-400 to-teal-400 text-white p-6 rounded-2xl shadow-md">
                <h2 className="text-2xl font-bold">Welcome back, {user?.name || "Auntie Mei"}!</h2>
                <p className="text-cyan-50 mt-2">Ready for another wonderful day of activities?</p>
            </div>

            {/* Progress */}
            <div className="w-full max-w-3xl bg-white p-4 mt-4 rounded-2xl shadow-sm">
                <div className="flex justify-between text-gray-700 font-semibold mb-2">
                    <span>Your Progress This Month</span>
                    <span className="text-cyan-600">3/10 activities</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full">
                    <div className="h-3 w-3/10 bg-cyan-400 rounded-full"></div>
                </div>
            </div>

            {/* Menu Cards */}
            <div className="w-full max-w-3xl grid grid-cols-2 gap-4 mt-4">
                <Card
                    icon={<BookOpen className="w-6 h-6 text-pink-500" />}
                    title="My Trails"
                    desc="Continue your learning journey"
                    onClick={() => navigate("/mytrails")}
                />
                <Card
                    icon={<Trophy className="w-6 h-6 text-yellow-500" />}
                    title="Leaderboard"
                    desc="See how you rank with friends"
                    onClick={() => navigate("/leaderboard")}
                />
                <Card
                    icon={<Gift className="w-6 h-6 text-red-500" />}
                    title="Rewards"
                    desc="Claim your earned rewards"
                    onClick={() => navigate("/rewards")}
                />
                <Card
                    icon={<Calendar className="w-6 h-6 text-purple-500" />}
                    title="Upcoming Events"
                    desc="Join community activities"
                    onClick={() => alert("Feature coming soon!")}
                />
            </div>

            {/* Daily Motivation */}
            <div className="w-full max-w-3xl bg-orange-100 mt-6 p-5 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                    <Lightbulb className="w-6 h-6 text-orange-500" />
                    <h3 className="text-orange-600 font-bold text-lg">Daily Motivation</h3>
                </div>
                <p className="text-gray-700 mt-2">
                    Try something new today! Maybe Mahjong class at Pasir Ris CC?
                </p>
                <button className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition">
                    Learn More
                </button>
            </div>

            {/* Community Highlights */}
            <div className="w-full max-w-3xl mt-6 bg-white p-5 rounded-2xl shadow-sm">
                <h3 className="text-gray-800 font-bold text-lg mb-4">
                    Community Highlights
                </h3>
                <div className="grid grid-cols-3 gap-4">
                    {highlights.map((h, i) => (
                        <div
                            key={i}
                            className={`${h.color} text-white p-4 rounded-2xl text-center shadow-sm`}
                        >
                            <h4 className="text-lg font-bold mb-2">{h.title}</h4>
                            <p className="text-sm">{h.subtitle}</p>
                            <p className="text-xs text-white/90 mt-1">{h.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Reusable Card Component
function Card({ icon, title, desc, onClick }) {
    return (
        <button
            onClick={onClick}
            className="bg-white rounded-2xl p-5 shadow-sm text-left hover:bg-cyan-50 transition flex flex-col justify-between"
        >
            <div className="flex items-center gap-3 mb-2">{icon}<h3 className="text-gray-800 font-bold text-lg">{title}</h3></div>
            <p className="text-gray-600 text-sm">{desc}</p>
        </button>
    );
}
