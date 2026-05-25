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

function canManageMinistryRole({
  currentRole,
  currentMinistryId,
  ministryId,
}: {
  currentRole: string
  currentMinistryId: string | null
  ministryId: string
}) {
  if (currentRole === "pastor") {
    return true
  }

  return currentRole === "lider" && currentMinistryId === ministryId
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: "Rol no válido" },
      { status: 400 }
    )
  }

  const currentUser = await getCurrentTenantUser(req)

  if (!currentUser) {
    return NextResponse.json(
      { message: "Acceso denegado" },
      { status: 401 }
    )
  }

  const db = await getTenantDbByName(currentUser.tenantDbName)
  const role = await db.collection<MinistryRole>("ministryRoles").findOne({
    _id: new ObjectId(id),
  })

  if (!role) {
    return NextResponse.json(
      { message: "Rol no encontrado" },
      { status: 404 }
    )
  }

  const currentRole = getCurrentRole(currentUser.user.role)
  const currentMinistryId = getCurrentMinistryId(currentUser.user.ministryId)

  if (
    !canManageMinistryRole({
      currentRole,
      currentMinistryId,
      ministryId: role.ministryId,
    })
  ) {
    return NextResponse.json(
      { message: "No tienes acceso a este rol" },
      { status: 403 }
    )
  }

  return NextResponse.json({ role })
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: "Rol no válido" },
      { status: 400 }
    )
  }

  const currentUser = await getCurrentTenantUser(req)

  if (!currentUser) {
    return NextResponse.json(
      { message: "Acceso denegado" },
      { status: 401 }
    )
  }

  const { name } = await req.json()

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json(
      { message: "El nombre del rol es obligatorio" },
      { status: 400 }
    )
  }

  const db = await getTenantDbByName(currentUser.tenantDbName)
  const roleId = new ObjectId(id)
  const existingRole = await db.collection<MinistryRole>("ministryRoles").findOne({
    _id: roleId,
  })

  if (!existingRole) {
    return NextResponse.json(
      { message: "Rol no encontrado" },
      { status: 404 }
    )
  }

  const currentRole = getCurrentRole(currentUser.user.role)
  const currentMinistryId = getCurrentMinistryId(currentUser.user.ministryId)

  if (
    !canManageMinistryRole({
      currentRole,
      currentMinistryId,
      ministryId: existingRole.ministryId,
    })
  ) {
    return NextResponse.json(
      { message: "No tienes permisos para modificar este rol" },
      { status: 403 }
    )
  }

  const normalizedName = normalizeRoleName(name)
  const duplicateRole = await db.collection<MinistryRole>("ministryRoles").findOne({
    _id: { $ne: roleId },
    ministryId: existingRole.ministryId,
    normalizedName,
  })

  if (duplicateRole) {
    return NextResponse.json(
      { message: "Ya existe un rol con ese nombre en este ministerio" },
      { status: 409 }
    )
  }

  await db.collection<MinistryRole>("ministryRoles").updateOne(
    { _id: roleId },
    {
      $set: {
        name: name.trim(),
        normalizedName,
        updatedAt: new Date(),
      },
    }
  )

  return NextResponse.json({ message: "Rol de ministerio actualizado" })
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: "Rol no válido" },
      { status: 400 }
    )
  }

  const currentUser = await getCurrentTenantUser(req)

  if (!currentUser) {
    return NextResponse.json(
      { message: "Acceso denegado" },
      { status: 401 }
    )
  }

  const db = await getTenantDbByName(currentUser.tenantDbName)
  const roleId = new ObjectId(id)
  const existingRole = await db.collection<MinistryRole>("ministryRoles").findOne({
    _id: roleId,
  })

  if (!existingRole) {
    return NextResponse.json(
      { message: "Rol no encontrado" },
      { status: 404 }
    )
  }

  const currentRole = getCurrentRole(currentUser.user.role)
  const currentMinistryId = getCurrentMinistryId(currentUser.user.ministryId)

  if (
    !canManageMinistryRole({
      currentRole,
      currentMinistryId,
      ministryId: existingRole.ministryId,
    })
  ) {
    return NextResponse.json(
      { message: "No tienes permisos para eliminar este rol" },
      { status: 403 }
    )
  }

  const usersUsingRole = await db.collection("users").countDocuments({
    ministryRoleId: id,
  })

  if (usersUsingRole > 0) {
    return NextResponse.json(
      { message: "No puedes eliminar un rol asignado a usuarios" },
      { status: 409 }
    )
  }

  await db.collection<MinistryRole>("ministryRoles").deleteOne({ _id: roleId })

  return NextResponse.json({ message: "Rol de ministerio eliminado" })
}
