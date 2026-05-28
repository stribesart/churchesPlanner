import { NextResponse } from "next/server"
import {
  getCurrentTenantUser,
  getGlobalEmailOwner,
  getTenantDbByName,
  normalizeEmail,
  removeUserFromTenantIndex,
  updateUserTenantIndex,
} from "@/lib/tenant"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"

function isLeaderRole(role: unknown) {
  if (typeof role !== "string") return false

  const normalizedRole = role.toLowerCase()

  return normalizedRole === "lider" || normalizedRole === "líder"
}

const allowedRoles = ["pastor", "lider", "miembro colaborador", "miembro"]

function isPasswordValid(password: string) {
  return /(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}/.test(password)
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const currentUser = await getCurrentTenantUser(req)
    const tenantDbName = currentUser?.tenantDbName

    if (!tenantDbName) {
      return NextResponse.json(
        { message: "Acceso denegado" },
        { status: 401 }
      )
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Usuario no válido" },
        { status: 400 }
      )
    }

    const { name, email, password, role, ministryId, ministryRoleId } = await req.json()
    const trimmedName = typeof name === "string" ? name.trim() : ""
    const normalizedEmail = normalizeEmail(email || "")
    const trimmedPassword = typeof password === "string" ? password.trim() : ""
    const db = await getTenantDbByName(tenantDbName)
    const userId = new ObjectId(id)
    const currentUserIsLeader = isLeaderRole(currentUser.user.role)
    const currentMinistryId =
      typeof currentUser.user.ministryId === "string"
        ? currentUser.user.ministryId
        : null
    const targetUser = await db.collection("users").findOne({ _id: userId })

    if (!targetUser) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    if (!trimmedName) {
      return NextResponse.json(
        { message: "El nombre es obligatorio" },
        { status: 400 }
      )
    }

    if (!normalizedEmail) {
      return NextResponse.json(
        { message: "El correo electrónico es obligatorio" },
        { status: 400 }
      )
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { message: "Ingresa un correo electrónico válido" },
        { status: 400 }
      )
    }

    if (trimmedPassword && !isPasswordValid(trimmedPassword)) {
      return NextResponse.json(
        {
          message:
            "La contraseña debe tener mínimo 8 caracteres, incluir una mayúscula, letras y un número",
        },
        { status: 400 }
      )
    }

    if (
      currentUserIsLeader &&
      (
        targetUser.role === "pastor" ||
        isLeaderRole(targetUser.role) ||
        !currentMinistryId ||
        targetUser.ministryId !== currentMinistryId
      )
    ) {
      return NextResponse.json(
        { message: "Solo puedes modificar colaboradores de tu ministerio" },
        { status: 403 }
      )
    }

    const existingEmailOwner = await getGlobalEmailOwner(normalizedEmail)

    if (
      existingEmailOwner &&
      (
        existingEmailOwner.dbName !== tenantDbName ||
        existingEmailOwner.userId?.toString() !== userId.toString()
      )
    ) {
      return NextResponse.json(
        { message: "Ya existe una cuenta registrada con ese correo" },
        { status: 409 }
      )
    }

    const normalizedRole =
      currentUserIsLeader ? "miembro colaborador" : role

    if (
      typeof normalizedRole !== "string" ||
      !allowedRoles.includes(normalizedRole)
    ) {
      return NextResponse.json(
        { message: "Selecciona un rol válido" },
        { status: 400 }
      )
    }

    if (!currentUserIsLeader && !isLeaderRole(normalizedRole)) {
      const assignedMinistry = await db.collection("ministeries").findOne({
        leader: userId.toString(),
      })

      if (assignedMinistry) {
        return NextResponse.json(
          {
            message:
              "Este usuario lidera un ministerio. Reasigna el ministerio antes de cambiar su rol.",
          },
          { status: 400 }
        )
      }
    }

    if (currentUserIsLeader) {
      if (
        typeof ministryRoleId !== "string" ||
        !ministryRoleId.trim() ||
        !ObjectId.isValid(ministryRoleId)
      ) {
        return NextResponse.json(
          { message: "Selecciona un rol del ministerio" },
          { status: 400 }
        )
      }

      const ministryRole = await db.collection("ministryRoles").findOne({
        _id: new ObjectId(ministryRoleId),
        ministryId: currentMinistryId,
      })

      if (!ministryRole) {
        return NextResponse.json(
          { message: "El rol no pertenece a tu ministerio" },
          { status: 403 }
        )
      }
    }

    const updateData: {
      name?: string
      email?: string
      password?: string
      role?: string
      ministryId?: string | null
      ministryRoleId?: string | null
    } = {
      name: trimmedName,
      email: normalizedEmail,
      role: normalizedRole,
    }

    if (currentUserIsLeader) {
      updateData.ministryId = currentMinistryId
    } else if (ministryId !== undefined) {
      updateData.ministryId =
        typeof ministryId === "string" && ministryId.trim() ? ministryId : null
    }

    if (currentUserIsLeader || ministryRoleId !== undefined) {
      updateData.ministryRoleId =
        typeof ministryRoleId === "string" && ministryRoleId.trim()
          ? ministryRoleId
          : null
    }

    if (trimmedPassword) {
      updateData.password = await bcrypt.hash(trimmedPassword, 10)
    }

    const result = await db.collection("users").updateOne(
      { _id: userId },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    await updateUserTenantIndex({
      dbName: tenantDbName,
      userId,
      email: normalizedEmail,
      role: normalizedRole,
    })

    return NextResponse.json({ message: "Usuario actualizado" })

  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { message: "Error interno" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const currentUser = await getCurrentTenantUser(req)
    const tenantDbName = currentUser?.tenantDbName

    if (!tenantDbName) {
      return NextResponse.json(
        { message: "Acceso denegado" },
        { status: 401 }
      )
    }

    const db = await getTenantDbByName(tenantDbName)

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Usuario no válido" },
        { status: 400 }
      )
    }

    const userId = new ObjectId(id)
    const currentUserIsLeader = isLeaderRole(currentUser.user.role)
    const currentMinistryId =
      typeof currentUser.user.ministryId === "string"
        ? currentUser.user.ministryId
        : null
    const targetUser = await db.collection("users").findOne({ _id: userId })

    if (
      currentUserIsLeader &&
      (
        !targetUser ||
        targetUser.role === "pastor" ||
        isLeaderRole(targetUser.role) ||
        !currentMinistryId ||
        targetUser.ministryId !== currentMinistryId
      )
    ) {
      return NextResponse.json(
        { message: "Solo puedes eliminar colaboradores de tu ministerio" },
        { status: 403 }
      )
    }

    const result = await db.collection("users").deleteOne({ _id: userId })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    await removeUserFromTenantIndex(tenantDbName, userId)

    return NextResponse.json({ message: "Usuario eliminado" })

  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { message: "Error interno" },
      { status: 500 }
    )
  }
}
