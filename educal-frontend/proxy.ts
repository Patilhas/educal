import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { AUTH_SESSION_COOKIE_NAME } from "@/server/auth/config";

const API_PROTECTED_PREFIXES = ["/api/events", "/api/users"];
const PUBLIC_FILE_REGEX = /\.(.*)$/;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value);

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    PUBLIC_FILE_REGEX.test(pathname)
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const isProtectedApi = API_PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isProtectedApi && !hasSession) {
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Sessão inválida ou expirada",
        },
      },
      { status: 401 },
    );
  }

  if (pathname === "/login") {
    if (hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  if (!pathname.startsWith("/api") && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};


