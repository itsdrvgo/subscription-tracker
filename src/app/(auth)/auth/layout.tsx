import { AuthShell } from "@/components/globals/layouts";
import { siteConfig } from "@/config/site";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: {
        default: "Authentication",
        template: "%s - Authentication - " + siteConfig.name,
    },
    description: "Authorize your account to access the platform",
};

export default function Layout({ children }: RootLayoutProps) {
    return <AuthShell>{children}</AuthShell>;
}
