import React from "react";

export function Button({
  children,
  className = "",
  variant = "positive", // default filled
  asChild = false,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-base font-semibold leading-tight whitespace-nowrap transition focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-0 disabled:opacity-60 disabled:cursor-not-allowed";

  const variants = {
    // Filled primary (like “New reward”)
    positive:
      "bg-teal-500 text-white hover:bg-teal-600 focus-visible:ring-teal-200",

    // White pill (like the Refresh on Rewards page)
    neutral:
      "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 focus-visible:ring-gray-200",

    // Keep others available if you use them elsewhere
    outline:
      "bg-white text-teal-700 border border-teal-500 hover:bg-teal-50 hover:border-teal-600 hover:text-teal-800 focus-visible:ring-teal-100",
    secondary:
      "bg-amber-400 text-white hover:bg-amber-500 focus-visible:ring-amber-200",
    ghost:
      "bg-white text-gray-800 hover:bg-gray-50 border border-gray-200 focus-visible:ring-gray-200",
    danger:
      "bg-rose-500 text-white hover:bg-rose-600 focus-visible:ring-rose-200",
    gradient:
      "bg-gradient-to-r from-teal-400 to-cyan-400 text-white hover:brightness-95 focus-visible:ring-cyan-100",
    none: ""
  };

  const hasOwnPalette = /(?:^|\s)(?:bg-|from-|to-|text-|border-)/.test(className);
  const palette = hasOwnPalette ? variants.none : (variants[variant] ?? variants.positive);

  const classes = [base, palette, className].filter(Boolean).join(" ").trim();

  if (asChild && React.isValidElement(children)) {
    const childClass = children.props.className ?? "";
    return React.cloneElement(children, {
      className: [classes, childClass].filter(Boolean).join(" ").trim(),
      ...props
    });
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
