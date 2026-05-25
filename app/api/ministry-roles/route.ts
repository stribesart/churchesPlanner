import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getCurrentTenantUser, getTenantDbByName } from "@/lib/tenant"
import type { MinistryRole } from "@/models/ministry-role"

function normalizeRoleName(name: string) {
  return name.trim().toLowerCase()
}

function getCurrentRole(role: unknown) {
  if (typeof role !== "string") return ""

  const normalizedRole = role
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  return normalizedRole === "administrador" ? "pastor" : normalizedRole
}

function getCurrentMinistryId(ministryId: unknown) {
  return typeof ministryId === "string" && ministryId.trim()
    ? ministryId
    : null
}

function resolveReadableMinistryId({
  requestedMinistryId,
  currentRole,
  currentMinistryId,
}: {
  requestedMinistryId: string | null
  currentRole: string
  currentMinistryId: string | null
}) {
  if (currentRole === "pastor") {
    return { ok: true as const, ministryId: requestedMinistryId }
  }

  if (currentRole === "lider" && currentMinistryId) {
    if (requestedMinistryId && requestedMinistryId !== currentMinistryId) {
      return { ok: false as const, status: 403, message: "No tienes acceso a ese ministerio" }
    }

    return { ok: true as const, ministryId: currentMinistryId }
  }

  return { ok: false as const, status: 403, message: "Acceso denegado" }
}

export async function GET(req: Request) {
  const currentUser = await getCurrentTenantUser(req)

  if (!currentUser) {
    return NextResponse.json(
      { message: "Acceso denegado" },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(req.url)
  const requestedMinistryId = searchParams.get("ministryId")
  const currentRole = getCurrentRole(currentUser.user.role)
  const currentMinistryId = getCurrentMinistryId(currentUser.user.ministryId)
  const access = resolveReadableMinistryId({
    requestedMinistryId,
    currentRole,
    currentMinistryId,
  })

  if (!access.ok) {
    return NextResponse.json(
      { message: access.message },
      { status: access.status }
    )
  }

  const db = await getTenantDbByName(currentUser.tenantDbName)
  const filter = access.ministryId ? { ministryId: access.ministryId } : {}
  const roles = await db
    .collection<MinistryRole>("ministryRoles")
    .find(filter)
    .sort({ name: 1 })
    .toArray()

  return NextResponse.json({ roles })
}

export async function POST(req: Request) {
  const currentUser = await getCurrentTenantUser(req)

  if (!currentUser) {
    return NextResponse.json(
      { message: "Acceso denegado" },
      { status: 401 }
    )
  }

  const { name, ministryId } = await req.json()
  const currentRole = getCurrentRole(currentUser.user.role)
  const currentMinistryId = getCurrentMinistryId(currentUser.user.ministryId)
  const requestedMinistryId =
    typeof ministryId === "string" && ministryId.trim() ? ministryId : null
  const access = resolveReadableMinistryId({
    requestedMinistryId,
    currentRole,
    currentMinistryId,
  })

  if (!access.ok) {
    return NextResponse.json(
      { message: access.message },
      { status: access.status }
    )
  }

  if (!access.ministryId) {
    return NextResponse.json(
      { message: "Selecciona un ministerio" },
      { status: 400 }
    )
  }

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json(
      { message: "El nombre del rol es obligatorio" },
      { status: 400 }
    )
  }

  const db = await getTenantDbByName(currentUser.tenantDbName)
  const ministryFilter = ObjectId.isValid(access.ministryId)
    ? {
        $or: [
          { ministryId: access.ministryId },
          { _id: new ObjectId(access.ministryId) },
        ],
      }
    : { ministryId: access.ministryId }
  const ministry = await db.collection("ministeries").findOne({
    ...ministryFilter,
  })

  if (!ministry) {
    return NextResponse.json(
      { message: "Ministerio no encontrado" },
      { status: 404 }
    )
  }

  const normalizedName = normalizeRoleName(name)
  const existingRole = await db.collection<MinistryRole>("ministryRoles").findOne({
    ministryId: access.ministryId,
    normalizedName,
  })

  if (existingRole) {
    return NextResponse.json(
      { message: "Ya existe un rol con ese nombre en este ministerio" },
      { status: 409 }
    )
  }

  const newRole: MinistryRole = {
    ministryId: access.ministryId,
    name: name.trim(),
    normalizedName,
    createdBy: currentUser.user._id.toString(),
    createdAt: new Date(),
  }

  const result = await db.collection<MinistryRole>("ministryRoles").insertOne(newRole)

  return NextResponse.json(
    {
      message: "Rol de ministerio creado",
      roleId: result.insertedId,
    },
    { status: 201 }
  )
}
