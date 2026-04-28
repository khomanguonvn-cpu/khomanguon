import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import authConfig from "./auth.config";

function generateRequestId() {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${randomPart}`;
}

const { auth } = NextAuth(authConfig);

export default auth(async function middleware(req) {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (pathname.startsWith("/admin")) {
    if (!session?.user) {
      const loginUrl = new URL("/signin", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const userRole = String(session.user.role ?? "").trim().toLowerCase();
    if (userRole !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  const existingRequestId = req.headers.get("x-request-id")?.trim();
  const requestId = existingRequestId || generateRequestId();

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-request-id", requestId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("x-request-id", requestId);

  return response;
});

export const config = {
  matcher: ["/admin/:path*"],
};
