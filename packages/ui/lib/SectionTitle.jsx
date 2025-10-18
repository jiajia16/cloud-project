import React from "react";

export function SectionTitle({ title, subtitle }) {
    return (
        <div className="mb-3">
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
            {subtitle ? <p className="text-sm text-gray-500">{subtitle}</p> : null}
        </div>
    );
}
