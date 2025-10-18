import React from "react";

export function ProgressSteps({ total = 6, completed = 2, labels = [] }) {
    const items = Array.from({ length: total }, (_, i) => i < completed);
    const pct = Math.round((completed / total) * 100);

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Trail Progress</p>
                <p className="text-sm font-semibold text-gray-800">{pct}%</p>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between mt-4">
                {items.map((done, i) => (
                    <div key={i} className="flex flex-col items-center text-xs">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center 
              ${done ? "bg-teal-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                            {done ? "🟢" : "⚪"}
                        </div>
                        {labels[i] ? <span className="mt-1 text-[11px] text-gray-600">{labels[i]}</span> : null}
                    </div>
                ))}
            </div>
        </div>
    );
}
