import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ClientProvider } from "@/components/providers";
import { siteConfig } from "@/config/site";
import { cn, getAbsoluteURL } from "@/lib/utils";
import { ThemeProvider } from "@wrksz/themes/next";
import { interHeading, outfit } from "./font";

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "white" },
        { media: "(prefers-color-scheme: dark)", color: "black" },
    ],
    colorScheme: "light",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
};

export const metadata: Metadata = {
    title: {
        default: siteConfig.name,
        template: "%s - " + siteConfig.name,
    },
    description: siteConfig.description,
    keywords: siteConfig.keywords,
    authors: [siteConfig.developer],
    publisher: `${siteConfig.name} Team`,
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    referrer: "origin-when-cross-origin",
    category: siteConfig.category,
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: siteConfig.name,
    },
    creator: siteConfig.name,
    openGraph: {
        title: siteConfig.name,
        description: siteConfig.description,
        url: getAbsoluteURL(),
        siteName: siteConfig.name,
        images: [
            {
                ...siteConfig.og,
                alt: siteConfig.name,
            },
        ],
        locale: "en_US",
        type: "website",
    },
    icons: {
        icon: [
            {
                url: "/favicon.ico",
                sizes: "32x32",
                type: "image/x-icon",
            },
            {
                url: "/favicon-96x96.png",
                sizes: "96x96",
                type: "image/png",
            },
        ],
        apple: "/apple-touch-icon.png",
    },
    manifest: "/site.webmanifest",
    metadataBase: new URL(getAbsoluteURL()),
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={cn(
                "h-full",
                "antialiased",
                "font-sans",
                outfit.variable,
                interHeading.variable
            )}
            suppressHydrationWarning
        >
            <body className="flex min-h-full flex-col">
                <ThemeProvider attribute="class" defaultTheme="dark">
                    <ClientProvider>{children}</ClientProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
