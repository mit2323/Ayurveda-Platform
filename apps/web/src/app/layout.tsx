import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/common/Providers";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
    title: {
        default: "AyurVeda — Pure Ayurvedic Wellness",
        template: "%s | AyurVeda",
    },
    description:
        "Discover authentic Ayurvedic products crafted from ancient wisdom. Pure herbs, oils, and formulations for holistic wellness.",
    keywords: ["ayurveda", "herbal", "wellness", "organic", "vata", "pitta", "kapha"],
    openGraph: {
        type: "website",
        locale: "en_IN",
        siteName: "AyurVeda",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="grain-overlay">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </head>
            <body suppressHydrationWarning>
                <Providers>
                    {children}
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            className: "toast-container",
                            style: {
                                background: "#fff",
                                color: "#1A1510",
                                border: "1px solid #E0D5C8",
                                borderRadius: "2px",
                                fontSize: "0.875rem",
                                fontFamily: "'DM Sans', sans-serif",
                                boxShadow: "0 4px 24px rgba(90,60,30,0.12)",
                            },
                            success: {
                                iconTheme: { primary: "#6A9457", secondary: "#fff" },
                            },
                            error: {
                                iconTheme: { primary: "#C0392B", secondary: "#fff" },
                            },
                        }}
                    />
                </Providers>

            </body>
        </html>
    );
}