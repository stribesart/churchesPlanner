import { NextResponse } from "next/server"
import { getTenantFromRequest, getTenantDbByName } from "@/lib/tenant"
import { ObjectId } from "mongodb"

function isLeaderRole(role: unknown) {
  if (typeof role !== "string") return false

  const normalizedRole = role.toLowerCase()

  return normalizedRole === "lider" || normalizedRole === "líder"
}

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

    const { name, description, leader } = await req.json()

    const db = await getTenantDbByName(tenantDbName)
    const ministryId = id
    const existingMinistry = await db.collection("ministeries").findOne({
      _id: new ObjectId(id),
    })

    if (!existingMinistry) {
      return NextResponse.json(
        { message: "Ministerio no encontrado" },
        { status: 404 }
      )
    }

    if (leader !== undefined) {
      if (typeof leader !== "string" || !ObjectId.isValid(leader)) {
        return NextResponse.json(
          { message: "Selecciona un líder válido" },
          { status: 400 }
        )
      }

      const selectedLeader = await db.collection("users").findOne({
        _id: new ObjectId(leader),
      })

      if (!selectedLeader || !isLeaderRole(selectedLeader.role)) {
        return NextResponse.json(
          { message: "El usuario seleccionado no es líder" },
          { status: 400 }
        )
      }

      if (
        typeof selectedLeader.ministryId === "string" &&
        selectedLeader.ministryId &&
        selectedLeader.ministryId !== ministryId
      ) {
        return NextResponse.json(
          { message: "El líder seleccionado ya pertenece a otro ministerio" },
          { status: 400 }
        )
      }
    }

    const updateData: { ministryId: string; name?: string; description?: string; leader?: string } = {
      ministryId,
    }

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (leader !== undefined) updateData.leader = leader

    await db.collection("ministeries").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    if (typeof leader === "string" && ObjectId.isValid(leader)) {
      await db.collection("users").updateOne(
        { _id: new ObjectId(leader) },
        { $set: { ministryId } }
      )
    }

    const previousLeader = existingMinistry?.leader
    if (
      typeof previousLeader === "string" &&
      previousLeader !== leader &&
      ObjectId.isValid(previousLeader)
    ) {
      await db.collection("users").updateOne(
        { _id: new ObjectId(previousLeader), ministryId },
        { $unset: { ministryId: "" } }
      )
    }

    return NextResponse.json({ message: "Ministerio actualizado" })

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
    const ministryId = id

    const result = await db.collection("ministeries").deleteOne({
      _id: new ObjectId(id),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Ministerio no encontrado" },
        { status: 404 }
      )
    }

    await db.collection("users").updateMany(
      { ministryId },
      { $unset: { ministryId: "" } }
    )

    return NextResponse.json({ message: "Ministerio eliminado" })

  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { message: "Error interno" },
      { status: 500 }
    )
  }
}
