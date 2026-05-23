import { NextRequest, NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
    const url = new URL(req.url);
    const res = NextResponse.next();

    if (url.pathname === "/")
        return NextResponse.redirect(new URL("/dashboard", req.url));

    return res;
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
