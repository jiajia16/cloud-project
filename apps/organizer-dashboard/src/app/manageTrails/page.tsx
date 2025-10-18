"use client";

import { Card } from "@silvertrails/ui";
import { Plus, QrCode, Edit } from "lucide-react";

export default function ManageTrailsPage() {
    const trails = [
        { activity: "Morning Tai Chi", date: "2024-01-15 09:00", location: "Community Garden", signups: "18/20", completed: 15, status: "Active" },
        { activity: "Senior Yoga Class", date: "2024-01-16 14:00", location: "Main Hall", signups: "12/15", completed: 10, status: "Active" },
        { activity: "Walking Group", date: "2024-01-17 08:30", location: "Park Trail", signups: "25/30", completed: 22, status: "Completed" },
        { activity: "Meditation Session", date: "2024-01-18 16:00", location: "Quiet Room", signups: "8/12", completed: 0, status: "Upcoming" },
    ];

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "Active": return "bg-teal-100 text-teal-700";
            case "Completed": return "bg-blue-100 text-blue-700";
            case "Upcoming": return "bg-orange-100 text-orange-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    return (
        <div className="space-y-8">
            {/* HEADER SECTION */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-800">Manage Trails</h2>
                <button className="flex items-center gap-2 bg-teal-500 text-white px-4 py-2 rounded-md shadow-sm hover:bg-teal-600 transition">
                    <Plus size={18} />
                    Create New Trail
                </button>
            </div>

            {/* TABLE SECTION */}
            <Card className="rounded-xl shadow-sm p-6 border border-gray-100 bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-auto">
                        <thead>
                            <tr className="text-gray-600 text-sm border-b">
                                <th className="pb-3 px-4 font-medium w-[18%]">Activity</th>
                                <th className="pb-3 px-4 font-medium w-[16%]">Date & Time</th>
                                <th className="pb-3 px-4 font-medium w-[18%]">Location</th>
                                <th className="pb-3 px-4 font-medium w-[14%]">Sign-ups</th>
                                <th className="pb-3 px-4 font-medium w-[10%]">Completed</th>
                                <th className="pb-3 px-4 font-medium w-[12%]">Status</th>
                                <th className="pb-3 px-4 font-medium text-center w-[12%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trails.map((trail, i) => (
                                <tr
                                    key={i}
                                    className="border-b last:border-none text-gray-800 text-sm hover:bg-gray-50 transition"
                                >
                                    <td className="py-4 px-4 font-semibold whitespace-nowrap">
                                        {trail.activity}
                                    </td>
                                    <td className="py-4 px-4 text-gray-600 whitespace-nowrap">
                                        {trail.date}
                                    </td>
                                    <td className="py-4 px-4 text-teal-600 underline cursor-pointer hover:text-teal-700 whitespace-nowrap">
                                        {trail.location}
                                    </td>
                                    <td className="py-4 px-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium">{trail.signups}</span>
                                            <div className="h-1.5 bg-gray-200 rounded-full">
                                                <div
                                                    className="h-1.5 bg-teal-400 rounded-full"
                                                    style={{
                                                        width: `${(parseInt(trail.signups.split("/")[0]) /
                                                            parseInt(trail.signups.split("/")[1])) *
                                                            100
                                                            }%`,
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">{trail.completed}</td>
                                    <td className="py-4 px-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(
                                                trail.status
                                            )}`}
                                        >
                                            {trail.status}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <div className="flex justify-center gap-3">
                                            <button className="flex items-center gap-1 bg-teal-100 text-teal-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-teal-200 transition">
                                                <QrCode size={14} />
                                                QR Code
                                            </button>
                                            <button className="flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-orange-200 transition">
                                                <Edit size={14} />
                                                Edit
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

        </div>
    );
}
