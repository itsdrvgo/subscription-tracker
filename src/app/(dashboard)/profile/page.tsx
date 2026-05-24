import { DashShell } from "@/components/globals/layouts";
import { ProfileManager } from "@/components/profile";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Profile",
    description: "Update your name, email, and password",
};

export default function Page() {
    return (
        <DashShell classNames={{ innerWrapper: "max-w-4xl" }}>
            <div>
                <h1 className="text-2xl font-bold">Profile</h1>
                <p className="text-sm text-balance text-muted-foreground">
                    Manage how you sign in and how your name appears in the app.
                </p>
            </div>

            <ProfileManager />
        </DashShell>
    );
}
