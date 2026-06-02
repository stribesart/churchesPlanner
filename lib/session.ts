import { createHmac, timingSafeEqual } from "crypto"
import { ObjectId } from "mongodb"
import type { NextResponse } from "next/server"

export const AUTH_SESSION_COOKIE = "auth_session"
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8

export type SessionPayload = {
  userId: string
  tenantDbName: string
  email: string
  role: string
  name: string
  realName?: string
  displayName?: string
  ministryId?: string | null
  ministryRoleId?: string | null
  isSuperUser?: boolean
  churchName?: string
  exp: number
}

type UserLike = {
  _id?: ObjectId | string
  email?: string
  role?: string
  name?: string
  realName?: string
  displayName?: string
  ministryId?: ObjectId | string | null
  ministryRoleId?: ObjectId | string | null
  isSuperUser?: boolean
}

type TenantLike = {
  dbName?: string
  churchName?: string
}

function getSessionSecret() {
  return (
    process.env.SESSION_SECRET ||
    process.env.JWT_SECRET ||
    process.env.MONGODB_URI ||
    "churches-planner-local-session-secret"
  )
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url")
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8")
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url")
}

function isValidSignature(value: string, signature: string) {
  const expected = sign(value)
  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  )
}

function stringifyId(value: ObjectId | string | null | undefined) {
  return value ? value.toString() : null
}

export function createSignedSession(payload: SessionPayload) {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  return `${encodedPayload}.${sign(encodedPayload)}`
}

export function readSignedSession(req: Request | { headers: Headers }) {
  const cookie = req.headers.get("cookie") || ""
  const signedSession = cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${AUTH_SESSION_COOKIE}=`))
    ?.split("=")[1]

  if (!signedSession) {
    return null
  }

  const [encodedPayload, signature] = decodeURIComponent(signedSession).split(".")

  if (!encodedPayload || !signature || !isValidSignature(encodedPayload, signature)) {
    return null
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload

    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }

    if (!payload.userId || !payload.tenantDbName || !ObjectId.isValid(payload.userId)) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export function buildSessionPayload({
  user,
  tenant,
}: {
  user: UserLike
  tenant: TenantLike
}): SessionPayload {
  const userId = stringifyId(user._id)

  if (!userId || !tenant.dbName) {
    throw new Error("Cannot create a session without userId and tenant dbName")
  }

  const name = user.name?.trim() || user.realName?.trim() || user.email || "Usuario"

  return {
    userId,
    tenantDbName: tenant.dbName,
    email: user.email || "",
    role: user.role || "",
    name,
    realName: user.realName,
    displayName: user.displayName,
    ministryId: stringifyId(user.ministryId),
    ministryRoleId: stringifyId(user.ministryRoleId),
    isSuperUser: Boolean(user.isSuperUser),
    churchName: tenant.churchName,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  }
}

export function setAuthCookies({
  response,
  payload,
}: {
  response: NextResponse
  payload: SessionPayload
}) {
  response.cookies.set(AUTH_SESSION_COOKIE, createSignedSession(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  })

  response.cookies.set("session", payload.userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  })

  response.cookies.set("tenant", payload.tenantDbName, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
}

export function sessionUserToDocument(payload: SessionPayload) {
  return {
    _id: new ObjectId(payload.userId),
    email: payload.email,
    role: payload.role,
    name: payload.name,
    realName: payload.realName || payload.name,
    displayName: payload.displayName || payload.name,
    ministryId: payload.ministryId,
    ministryRoleId: payload.ministryRoleId,
    isSuperUser: Boolean(payload.isSuperUser),
  }
}

export function sessionUserToResponse(payload: SessionPayload) {
  return {
    _id: payload.userId,
    email: payload.email,
    role: payload.role,
    name: payload.name,
    realName: payload.realName || payload.name,
    displayName: payload.displayName || payload.name,
    ministryId: payload.ministryId,
    ministryRoleId: payload.ministryRoleId,
    isSuperUser: Boolean(payload.isSuperUser),
  }
}
