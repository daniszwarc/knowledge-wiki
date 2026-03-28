import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/login/verify",
  "/login/setup-2fa",
  "/api/auth/",
  "/api/embed",
  "/api/articles/embed",
  "/_next/",
  "/favicon.ico",
];

const VALIDATOR_PATHS = ["/validate", "/gaps"];
const ADMIN_PATHS = ["/admin"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get("wiki_session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Validate session via internal API call to avoid importing DB in edge middleware
  const baseUrl = req.nextUrl.origin;
  let session: { userId: string; email: string; role: string } | null = null;

  try {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { cookie: `wiki_session=${token}` },
    });
    if (res.ok) {
      session = await res.json();
    }
  } catch {
    // fetch failed — treat as unauthenticated
  }

  if (!session) {
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("wiki_session");
    return response;
  }

  // Role-based path guards
  if (ADMIN_PATHS.some((p) => pathname.startsWith(p)) && session.role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (
    VALIDATOR_PATHS.some((p) => pathname === p || pathname.startsWith(p)) &&
    !["validator", "editor", "admin"].includes(session.role)
  ) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Attach user info to request headers
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-id", session.userId);
  requestHeaders.set("x-user-email", session.email);
  requestHeaders.set("x-user-role", session.role);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
