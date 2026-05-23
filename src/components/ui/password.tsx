import { cn } from "@/lib/utils";
import { useState } from "react";
import { Icons } from "../icons";
import { Button } from "./button";
import { Input } from "./input";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    showToggle?: boolean;
}

export function PasswordInput({
    className,
    showToggle = true,
    ...props
}: PasswordInputProps) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="relative">
            <Input
                type={showPassword ? "text" : "password"}
                className={cn("pr-10", className)}
                {...props}
            />

            {showToggle && (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1/2 right-1.5 size-7 -translate-y-1/2 rounded-sm"
                    onClick={() => setShowPassword((prev) => !prev)}
                >
                    {showPassword ? (
                        <Icons.EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <Icons.Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                </Button>
            )}
        </div>
    );
}
