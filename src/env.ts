import { createEnv } from "@t3-oss/env-nextjs";
import z from "zod";

export const env = createEnv({
    server: {
        DATABASE_URL: z.url("DATABASE_URL must be a valid URL"),

        JWT_SECRET: z
            .string()
            .min(32, "JWT_SECRET must be at least 32 characters"),

        RESEND_API_KEY: z.string().optional(),
        EMAIL_FROM: z
            .string()
            .optional()
            .default("Subscription Tracker Dev <onboarding@resend.dev>"),
        CRON_SECRET: z.string().optional(),
    },
    client: {
        NEXT_PUBLIC_DEPLOYMENT_URL: z
            .string("NEXT_PUBLIC_DEPLOYMENT_URL must be a valid URL")
            .optional(),
    },
    runtimeEnv: {
        DATABASE_URL: process.env.DATABASE_URL,

        JWT_SECRET: process.env.JWT_SECRET,

        RESEND_API_KEY: process.env.RESEND_API_KEY,
        EMAIL_FROM: process.env.EMAIL_FROM,
        CRON_SECRET: process.env.CRON_SECRET,

        NEXT_PUBLIC_DEPLOYMENT_URL: process.env.NEXT_PUBLIC_DEPLOYMENT_URL,
    },
    skipValidation: !!process.env.SKIP_ENV_VALIDATION,
    emptyStringAsUndefined: true,
});
