import { SignInForm } from "@/components/globals/forms";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign In",
    description: "Sign in to your existing account",
};

export default function Page() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl font-bold md:text-2xl">
                    Login
                </CardTitle>
                <CardDescription>
                    Sign in to your existing account to access your dashboard.
                </CardDescription>
            </CardHeader>

            <CardContent>
                <SignInForm />
            </CardContent>
        </Card>
    );
}
