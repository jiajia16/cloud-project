import React from "react";

export function Card({ children, className = "" }) {
    return (
        <div className={`bg-white rounded-3xl shadow-sm border border-gray-100 p-5 ${className}`}>
            {children}
        </div>
    );
}
