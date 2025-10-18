const sharedConfig = require("../../packages/ui/tailwind.config.js");

module.exports = {
    ...sharedConfig,
    content: [
        "./app/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        ...sharedConfig.content,
    ],
};
