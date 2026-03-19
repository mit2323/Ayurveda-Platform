import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: "#f5f7ee",
                    100: "#e8efd4",
                    200: "#d2dfac",
                    300: "#b3c87a",
                    400: "#94b051",
                    500: "#749538",   // primary green
                    600: "#5a7529",
                    700: "#455a21",
                    800: "#38491c",
                    900: "#303e1a",
                },
                gold: {
                    400: "#d4a843",
                    500: "#c49a2e",
                    600: "#a8821f",
                },
                earth: {
                    100: "#f5efe6",
                    200: "#e8d5b8",
                    500: "#a0784a",
                    800: "#4a3220",
                },
            },
            fontFamily: {
                sans: ["var(--font-inter)", "system-ui", "sans-serif"],
                serif: ["var(--font-playfair)", "Georgia", "serif"],
            },
            animation: {
                "fade-in": "fadeIn 0.3s ease-in-out",
                "slide-up": "slideUp 0.3s ease-out",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                slideUp: {
                    "0%": { transform: "translateY(10px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
            },
        },
    },
    plugins: [],
};

export default config;