import React, { useState } from "react";
import Layout from "../components/Layout.jsx";
import { Card, Tabs } from "@silvertrails/ui";
import { Medal } from "lucide-react";


const demo = [
    { name: "Auntie Mei", pts: 220 },
    { name: "Uncle Lim", pts: 210 },
    { name: "Mdm Tan", pts: 200 },
    { name: "Mr Goh", pts: 190 },
    { name: "Mrs Ong", pts: 180 },
];

export default function Leaderboard() {
    const [active, setActive] = useState("My CC");
    const list = demo;

    return (
        <Layout title="Leaderboard">
            <div className="pb-24 px-4">
                <Tabs
                    tabs={["My CC", "All Seniors"]}
                    active={active}
                    onChange={setActive}
                    className="text-gray-800 font-medium"
                />

                <Card className="mb-3 mt-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                        {list.slice(0, 3).map((p, i) => {
                            const medalColors = [
                                "text-yellow-400", // Gold
                                "text-gray-400",   // Silver
                                "text-amber-700",  // Bronze
                            ];

                            return (
                                <div key={p.name} className="p-3">
                                    <Medal className={`w-10 h-10 mx-auto ${medalColors[i]}`} />
                                    <div className="font-semibold mt-1">{p.name}</div>
                                    <div className="text-teal-600 font-bold">{p.pts} pts</div>
                                </div>
                            );
                        })}
                    </div>
                </Card>


                <Card>
                    <ul className="divide-y">
                        {list.map((p, i) => (
                            <li
                                key={p.name}
                                className="py-3 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700">
                                        {i + 1}
                                    </div>
                                    <span className="font-medium">{p.name}</span>
                                </div>
                                <span className="font-semibold text-gray-800">
                                    {p.pts} pts
                                </span>
                            </li>
                        ))}
                    </ul>
                    <p className="mt-3 text-sm text-gray-600 text-center">
                        Keep going! You’re #4 this week!
                    </p>
                </Card>
            </div>
        </Layout>
    );
}
