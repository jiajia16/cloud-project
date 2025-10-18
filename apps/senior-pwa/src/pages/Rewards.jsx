import React, { useState } from "react";
import Layout from "../components/Layout.jsx";
import { Card, Button, SectionTitle } from "@silvertrails/ui";

const rewards = [
    { id: 1, name: "$5 Supermarket Voucher", cost: 100 },
    { id: 2, name: "Tote Bag", cost: 80 },
    { id: 3, name: "Water Bottle", cost: 60 },
    { id: 4, name: "Tea Set", cost: 120 },
];

export default function Rewards() {
    const [points, setPoints] = useState(120);
    const [history, setHistory] = useState([]);

    const redeem = (r) => {
        if (points < r.cost) return alert("Not enough points.");
        if (confirm(`Redeem "${r.name}" for ${r.cost} points?`)) {
            setPoints(points - r.cost);
            setHistory([{ name: r.name, cost: r.cost, ts: new Date().toLocaleString() }, ...history]);
        }
    };

    return (
        <Layout title="Rewards">
            <Card className="mb-4 text-center">
                <p className="text-gray-600">You have</p>
                <p className="text-4xl font-extrabold text-teal-600">{points} points</p>
            </Card>

            <SectionTitle title="Redeemable Rewards" />
            <div className="grid grid-cols-2 gap-3 mb-4">
                {rewards.map((r) => (
                    <Card key={r.id} className="p-4">
                        <p className="font-semibold mb-2">{r.name}</p>
                        <p className="text-sm text-gray-500 mb-3">{r.cost} pts</p>
                        <Button className="w-full" onClick={() => redeem(r)}>Redeem</Button>
                    </Card>
                ))}
            </div>

            <SectionTitle title="History" />
            <Card>
                {history.length === 0 ? <p className="text-gray-500">No redemptions yet.</p> : (
                    <ul className="space-y-2">
                        {history.map((h, i) => (
                            <li key={i} className="flex justify-between text-sm">
                                <span>{h.name}</span>
                                <span className="text-gray-600">-{h.cost} • {h.ts}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </Layout>
    );
}
