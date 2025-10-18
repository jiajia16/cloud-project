"use client";

export default function ReportsPage() {
    const reports = [
        { title: "Participation Report", desc: "Detailed participant activity data", action: "Export CSV", color: "teal" },
        { title: "Activity Summary", desc: "Overview of all activities and attendance", action: "Export PDF", color: "teal" },
        { title: "Member Directory", desc: "Complete list of registered participants", action: "Export Excel", color: "orange" },
        { title: "Monthly Report", desc: "Comprehensive monthly statistics", action: "Export PDF", color: "teal" },
    ];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold mb-4">Export Reports</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {reports.map((r, i) => (
                    <div key={i} className="border border-gray-100 rounded-xl p-4 shadow-sm">
                        <h4 className="font-semibold text-gray-800">{r.title}</h4>
                        <p className="text-sm text-gray-600 mb-3">{r.desc}</p>
                        <button
                            className={`w-full py-2 rounded-md text-white text-sm font-medium ${r.color === "orange"
                                ? "bg-orange-400 hover:bg-orange-500"
                                : "bg-teal-500 hover:bg-teal-600"
                                }`}
                        >
                            {r.action}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
