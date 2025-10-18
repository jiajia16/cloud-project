import React from "react";

export function Button({ children, className = "", variant = "primary", ...props }) {
    const base = "px-5 py-3 rounded-2xl text-lg font-semibold focus:outline-none focus:ring-4 transition";
    const variants = {
        primary: "bg-teal-500 text-white hover:bg-teal-600 focus:ring-teal-200",
        secondary: "bg-amber-400 text-white hover:bg-amber-500 focus:ring-amber-200",
        ghost: "bg-white text-gray-800 hover:bg-gray-50 border border-gray-200",
        danger: "bg-rose-500 text-white hover:bg-rose-600 focus:ring-rose-200"
    };
    return (
        <button className={`${base} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
}
