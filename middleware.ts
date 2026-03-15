import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {

  const isLoggedIn = request.cookies.get("session")

  const { pathname } = request.nextUrl

  // rutas protegidas
  const protectedRoutes = [
    "/dashboard",
    "/users",
    "/ministries",
    "/events",
    "/inventory",
    "/announcements",
    "/offerings",
  ]

  const isProtected = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  // este debe funcionar seguramente una vez que se implemente el login en mongodb
  // if (isProtected && !isLoggedIn) {
  //   return NextResponse.redirect(new URL("/login", request.url))
  // }
  if (isProtected) {  // Quita "&& !isLoggedIn" para bloquear siempre
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/users/:path*",
    "/ministries/:path*",
    "/events/:path*",
    "/inventory/:path*",
    "/announcements/:path*",
    "/offerings/:path*",
  ],
}