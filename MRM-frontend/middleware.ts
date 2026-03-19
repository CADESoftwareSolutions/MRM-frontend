import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DASHBOARD_HOST = "dashboard.cade.solutions";
const WWW_HOST = "www.cade.solutions";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;
  const url = request.nextUrl.clone();

  // Only apply host-based routing for production subdomains
  if (host === DASHBOARD_HOST) {
    // dashboard.cade.solutions: / → rewrite to /Dashboard
    if (pathname === "/") {
      url.pathname = "/Dashboard";
      return NextResponse.rewrite(url);
    }
    // dashboard.cade.solutions: marketing paths → redirect to www
    if (pathname === "/Services" || pathname.startsWith("/Services/") || pathname === "/Pricing" || pathname === "/ContactUs") {
      url.host = WWW_HOST;
      url.protocol = "https:";
      return NextResponse.redirect(url);
    }
  }

  if (host === WWW_HOST) {
    // www.cade.solutions: dashboard paths → redirect to dashboard subdomain
    if (pathname === "/Dashboard" || pathname.startsWith("/Dashboard/") || pathname.startsWith("/Login")) {
      url.host = DASHBOARD_HOST;
      url.protocol = "https:";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/Dashboard",
    "/Dashboard/:path*",
    "/Login",
    "/Login/:path*",
    "/Services",
    "/Services/:path*",
    "/Pricing",
    "/ContactUs",
  ],
};
