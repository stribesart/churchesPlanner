import { NextResponse } from "next/server"
import {
  getGlobalEmailOwner,
  getTenantDbByName,
  getTenantFromRequest,
  normalizeEmail,
  removeUserFromTenantIndex,
  updateUserTenantIndex,
} from "@/lib/tenant"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tenantDbName = await getTenantFromRequest(req)

    if (!tenantDbName) {
      return NextResponse.json(
        { message: "Acceso denegado" },
        { status: 401 }
      )
    }

    const { name, email, password, role } = await req.json()
    const normalizedEmail = normalizeEmail(email || "")
    const db = await getTenantDbByName(tenantDbName)
    const userId = new ObjectId(id)
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

    const updateData: { name?: string; email?: string; password?: string; role?: string } = {
      name,
      email: normalizedEmail,
      role,
    }

    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10)
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
      role,
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
    const tenantDbName = await getTenantFromRequest(req)

    if (!tenantDbName) {
      return NextResponse.json(
        { message: "Acceso denegado" },
        { status: 401 }
      )
    }

    const db = await getTenantDbByName(tenantDbName)

    const userId = new ObjectId(id)

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
