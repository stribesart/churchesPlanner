import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const protectedRoutes = [
  "/dashboard",
  "/users",
  "/ministeries",
  "/events",
  "/inventory",
  "/announcements",
  "/offerings",
]

function isProtectedPath(pathname: string) {
  return protectedRoutes.some((route) => pathname.startsWith(route))
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isLoggedIn = Boolean(request.cookies.get("auth_session"))

  if (isProtectedPath(pathname) && !isLoggedIn) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", pathname)

    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/users/:path*",
    "/ministeries/:path*",
    "/events/:path*",
    "/inventory/:path*",
    "/announcements/:path*",
    "/offerings/:path*",
  ],
}
