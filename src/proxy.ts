import { NextRequest, NextResponse } from "next/server";
import { COOKIES } from "./config/const";
import { checkRateLimit, RATE_LIMITS } from "./lib/api/rate-limit";
import { signToken, verifyToken } from "./lib/jwt";
import { CResponse, getClientIp } from "./lib/utils";

const PUBLIC_PATHS = ["/auth/signin", "/api/auth/signin", "/api/cron/renewals"];

const SECURITY_HEADERS: Record<string, string> = {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-DNS-Prefetch-Control": "off",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

function applySecurityHeaders(res: NextResponse) {
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
        res.headers.set(key, value);
    }
    return res;
}

export async function proxy(req: NextRequest): Promise<NextResponse> {
    const url = new URL(req.url);

    // Edge-level per-IP floor so a stray bot can't burn through any single
    // route's bucket. Route-level limits are stricter and still apply.
    if (url.pathname.startsWith("/api")) {
        const ip = getClientIp(req);
        const limit = checkRateLimit(
            `edge:${ip}`,
            RATE_LIMITS.EDGE_GLOBAL.limit,
            RATE_LIMITS.EDGE_GLOBAL.windowMs
        );
        if (!limit.ok) {
            const res = CResponse({
                message: "TOO_MANY_REQUESTS",
                longMessage: "Too many requests",
            });
            res.headers.set(
                "Retry-After",
                Math.ceil(limit.retryAfterMs / 1000).toString()
            );
            return applySecurityHeaders(res);
        }
    }

    if (PUBLIC_PATHS.some((path) => url.pathname.startsWith(path)))
        return applySecurityHeaders(NextResponse.next());

    if (url.pathname === "/auth")
        return applySecurityHeaders(
            NextResponse.redirect(new URL("/auth/signin", url))
        );

    if (url.pathname === "/")
        return applySecurityHeaders(
            NextResponse.redirect(new URL("/dashboard", url))
        );

    const token = req.cookies.get(COOKIES.ADMIN)?.value;
    const user = token ? await verifyToken(token) : null;

    if (user?.id) {
        if (url.pathname.startsWith("/auth"))
            return applySecurityHeaders(
                NextResponse.redirect(new URL("/dashboard", url))
            );

        const res = NextResponse.next();
        const newToken = await signToken({ id: user.id });

        res.cookies.set(COOKIES.ADMIN, newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
        });
        return applySecurityHeaders(res);
    }

    if (url.pathname.startsWith("/api")) {
        const response = CResponse({
            message: "UNAUTHORIZED",
            longMessage: "You are not signed in",
        });
        response.cookies.delete(COOKIES.ADMIN);
        return applySecurityHeaders(response);
    }

    const response = NextResponse.redirect(new URL("/auth/signin", url));
    response.cookies.delete(COOKIES.ADMIN);
    return applySecurityHeaders(response);
}

export const config = {
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        "/api/:path*",
        "/",
        "/dashboard/:path*",
        "/auth/:path*",
    ],
};
