"use client";

export default function ParticipantsPage() {
    const participants = [
        { name: "Uncle Lim", email: "lim@email.com", joinDate: "2024-01-01", activities: 15, lastActive: "2 hours ago", status: "Active" },
        { name: "Auntie Chen", email: "chen@email.com", joinDate: "2024-01-03", activities: 12, lastActive: "1 day ago", status: "Active" },
        { name: "Mrs. Wong", email: "wong@email.com", joinDate: "2024-01-05", activities: 8, lastActive: "3 days ago", status: "Inactive" },
    ];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold mb-4">Participant Management</h3>
            <table className="w-full text-sm text-left text-gray-600">
                <thead>
                    <tr className="border-b text-gray-500">
                        <th className="pb-2">Participant</th>
                        <th className="pb-2">Email</th>
                        <th className="pb-2">Join Date</th>
                        <th className="pb-2">Activities</th>
                        <th className="pb-2">Last Active</th>
                        <th className="pb-2">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {participants.map((p, i) => (
                        <tr key={i} className="border-b hover:bg-gray-50">
                            <td className="py-2 font-semibold flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-sm font-medium">
                                    {p.name.charAt(0)}
                                </div>
                                {p.name}
                            </td>
                            <td>{p.email}</td>
                            <td>{p.joinDate}</td>
                            <td>{p.activities}</td>
                            <td>{p.lastActive}</td>
                            <td>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs ${p.status === "Active"
                                        ? "bg-teal-100 text-teal-700"
                                        : "bg-orange-100 text-orange-700"
                                        }`}
                                >
                                    {p.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
