"use client";

export default function InsightsPage() {
    const popular = [
        { activity: "Tai Chi", participants: 45, change: "+12%" },
        { activity: "Walking Group", participants: 38, change: "+8%" },
        { activity: "Yoga", participants: 32, change: "+15%" },
    ];

    const metrics = [
        { title: "Repeat Participants", desc: "Regular attendees", value: "67%" },
        { title: "New Sign-ups", desc: "This month", value: "23" },
        { title: "Growth Rate", desc: "Monthly increase", value: "+15%" },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold mb-4">Popular Activities</h3>
                <div className="space-y-3">
                    {popular.map((p, i) => (
                        <div key={i} className="border border-gray-100 rounded-xl p-3 flex justify-between items-center hover:bg-gray-50">
                            <div>
                                <h4 className="font-medium text-gray-800">{p.activity}</h4>
                                <p className="text-sm text-gray-600">{p.participants} participants</p>
                            </div>
                            <div className="text-teal-600 font-semibold">{p.change}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold mb-4">Engagement Metrics</h3>
                <div className="space-y-3">
                    {metrics.map((m, i) => (
                        <div key={i} className="border border-gray-100 rounded-xl p-3 flex justify-between items-center hover:bg-gray-50">
                            <div>
                                <h4 className="font-medium text-gray-800">{m.title}</h4>
                                <p className="text-sm text-gray-600">{m.desc}</p>
                            </div>
                            <div className="text-teal-600 font-bold">{m.value}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
