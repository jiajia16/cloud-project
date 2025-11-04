import React from "react";

export function Button({ children, className = "", variant = "primary", asChild = false, ...props }) {
    const base = "px-5 py-3 rounded-2xl text-lg font-semibold focus:outline-none focus:ring-4 transition";
    const variants = {
        primary: "bg-teal-500 text-white hover:bg-teal-600 focus:ring-teal-200",
        secondary: "bg-amber-400 text-white hover:bg-amber-500 focus:ring-amber-200",
        ghost: "bg-white text-gray-800 hover:bg-gray-50 border border-gray-200",
        danger: "bg-rose-500 text-white hover:bg-rose-600 focus:ring-rose-200",
        outline: "bg-white text-teal-600 border border-teal-500 hover:bg-teal-50",
    };

    const classes = `${base} ${variants[variant] ?? variants.primary} ${className}`.trim();

    if (asChild && React.isValidElement(children)) {
        const childClass = children.props.className ?? "";
        return React.cloneElement(children, {
            className: `${classes} ${childClass}`.trim(),
            ...props,
        });
    }

    return (
        <button className={classes} {...props}>
            {children}
        </button>
    );
}
