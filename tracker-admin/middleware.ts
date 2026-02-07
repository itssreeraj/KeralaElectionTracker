import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Only protect /admin routes
  if (!path.startsWith("/admin")) {
    return NextResponse.next();
  }

  const token = req.cookies.get("ADMIN_TOKEN")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("[MIDDLEWARE_ERROR] JWT_SECRET not configured");
      return NextResponse.redirect(new URL("/login", req.url));
    }
    
    const secret = new TextEncoder().encode(jwtSecret);
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch (error) {
    console.error("[MIDDLEWARE_ERROR] Token verification failed:", error instanceof Error ? error.message : String(error));
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
