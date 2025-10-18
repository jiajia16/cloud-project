import React from "react";
import Layout from "../components/Layout.jsx";
import { Card, Button, SectionTitle } from "@silvertrails/ui";

export default function Social() {
    const invite = () => {
        const link = window.location.origin + "/login?ref=friend";
        navigator.clipboard?.writeText(link);
        alert("Invite link copied! Share with family or friends.");
    };

    return (
        <Layout title="Community">
            <Card className="mb-4">
                <SectionTitle title="Invite a Friend" subtitle="Join activities together for bonus points" />
                <Button onClick={invite}>Share Invite Link</Button>
            </Card>

            <SectionTitle title="My Group" />
            <Card className="mb-4">
                <ul className="space-y-2">
                    {["Auntie Mei", "Uncle Lim", "Mdm Tan"].map(n => (
                        <li key={n} className="flex items-center justify-between">
                            <span className="font-medium">{n}</span>
                            <span className="text-sm text-teal-700 font-semibold">+10 pts today</span>
                        </li>
                    ))}
                </ul>
            </Card>

            {/* Message Board Section */}
            <SectionTitle title="Message Board" />

            <Card className="p-4">
                {/* Header with button */}
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Message Board</h3>
                    <button className="bg-teal-400 hover:bg-cyan-400 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition">
                        💬 Send Message
                    </button>
                </div>

                {/* Message List */}
                <div className="space-y-3">
                    {[
                        {
                            name: "Uncle Lim",
                            time: "2 hours ago",
                            message: "Great job on the Tai Chi class! 👍",
                            avatar: "🧓",
                        },
                        {
                            name: "Auntie Chen",
                            time: "1 day ago",
                            message: "Keep it up everyone! 🖤",
                            avatar: "👩‍🦳",
                        },
                        {
                            name: "David (Son)",
                            time: "2 days ago",
                            message: "So proud of you Mom! 🎉",
                            avatar: "👨‍🦱",
                        },
                    ].map((m, i) => (
                        <div
                            key={i}
                            className="flex items-start gap-3 p-3 bg-teal-50 rounded-xl shadow-sm"
                        >
                            <div className="text-3xl">{m.avatar}</div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-800">{m.name}</span>
                                    <span className="text-gray-500 text-sm">{m.time}</span>
                                </div>
                                <p className="text-gray-700 mt-1">{m.message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

        </Layout>
    );
}
