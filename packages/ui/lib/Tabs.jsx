import React from "react";

export function Tabs({ tabs = [], active, onChange }) {
    return (
        <div className="flex gap-2 mb-4">
            {tabs.map((t) => (
                <button
                    key={t}
                    className={`px-4 py-2 rounded-full text-sm font-medium border
            ${active === t ? "bg-teal-500 text-white border-teal-500" : "bg-white text-gray-700 border-gray-200"}`}
                    onClick={() => onChange?.(t)}
                >
                    {t}
                </button>
            ))}
        </div>
    );
}
