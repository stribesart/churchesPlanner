import { randomBytes, createHash } from "crypto"
import { NextResponse } from "next/server"

import clientPromise from "@/lib/mongodb"
import { getCurrentTenantUser } from "@/lib/tenant"

const INVITE_EXPIRES_IN_HOURS = 12

function normalizeRole(role: unknown) {
  if (typeof role !== "string") return ""

  return role
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function canCreateInvite(role: unknown) {
  const normalizedRole = normalizeRole(role)

  return ["administrador", "pastor", "lider"].includes(normalizedRole)
}

function createToken() {
  return randomBytes(32).toString("base64url")
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export async function POST(req: Request) {
  const currentUser = await getCurrentTenantUser(req)

  if (!currentUser) {
    return NextResponse.json(
      { message: "Acceso denegado" },
      { status: 401 }
    )
  }

  if (!canCreateInvite(currentUser.user.role)) {
    return NextResponse.json(
      { message: "No tienes permisos para crear invitaciones" },
      { status: 403 }
    )
  }

  const client = await clientPromise
  const globalDb = client.db("churchesPlanner")
  const church = await globalDb.collection("churches").findOne({
    dbName: currentUser.tenantDbName,
  })

  if (!church) {
    return NextResponse.json(
      { message: "Iglesia no encontrada" },
      { status: 404 }
    )
  }

  const token = createToken()
  const tokenHash = hashToken(token)
  const expiresAt = new Date(
    Date.now() + INVITE_EXPIRES_IN_HOURS * 60 * 60 * 1000
  )

  await globalDb.collection("invites").insertOne({
    tokenHash,
    dbName: currentUser.tenantDbName,
    churchName: church.churchName,
    createdByUserId: currentUser.user._id,
    createdByRole: currentUser.user.role,
    defaultRole: "miembro",
    expiresAt,
    maxUses: null,
    usedCount: 0,
    isActive: true,
    createdAt: new Date(),
  })

  const inviteUrl = new URL(`/invite/${token}`, req.url).toString()

  return NextResponse.json({
    inviteUrl,
    expiresAt,
    expiresInHours: INVITE_EXPIRES_IN_HOURS,
  })
}
