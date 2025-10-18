// packages/ui/tailwind.config.js
export default {
    content: [
        "../../apps/senior-pwa/**/*.{js,jsx,ts,tsx}",
        "../../apps/organizer-dashboard/**/*.{js,jsx,ts,tsx}",
        "./**/*.{js,jsx,ts,tsx}"
    ],
    theme: {
        extend: {
            colors: {
                primary: "#22d3ee",
                secondary: "#fbbf24",
                background: "#f8fafc",
            },
            fontFamily: {
                sans: ["Inter", "sans-serif"],
            },
        },
    },
    plugins: [],
};
