import { NextResponse } from "next/server"
import { getTenantFromRequest, getTenantDbByName } from "@/lib/tenant"
import { ObjectId } from "mongodb"

function isLeaderRole(role: unknown) {
  if (typeof role !== "string") return false

  const normalizedRole = role.toLowerCase()

  return normalizedRole === "lider" || normalizedRole === "líder"
}

function parseMinistryInput(body: Record<string, unknown>) {
  const name = typeof body.name === "string" ? body.name.trim() : ""
  const description =
    typeof body.description === "string" ? body.description.trim() : ""
  const leader = typeof body.leader === "string" ? body.leader.trim() : ""

  if (!name) return { ok: false as const, message: "El nombre del ministerio es obligatorio" }
  if (!leader || !ObjectId.isValid(leader)) {
    return { ok: false as const, message: "Selecciona un líder válido" }
  }

  return { ok: true as const, ministry: { name, description, leader } }
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

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Ministerio no válido" },
        { status: 400 }
      )
    }

    const body = await req.json()
    const parsed = parseMinistryInput(body)

    if (!parsed.ok) {
      return NextResponse.json({ message: parsed.message }, { status: 400 })
    }

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

    const selectedLeader = await db.collection("users").findOne({
      _id: new ObjectId(parsed.ministry.leader),
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

    const duplicateMinistry = await db.collection("ministeries").findOne({
      _id: { $ne: new ObjectId(id) },
      name: parsed.ministry.name,
    })

    if (duplicateMinistry) {
      return NextResponse.json(
        { message: "El ministerio ya existe" },
        { status: 400 }
      )
    }

    const updateData = {
      ministryId,
      ...parsed.ministry,
    }

    await db.collection("ministeries").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    await db.collection("users").updateOne(
      { _id: new ObjectId(parsed.ministry.leader) },
      { $set: { ministryId } }
    )

    const previousLeader = existingMinistry?.leader
    if (
      typeof previousLeader === "string" &&
      previousLeader !== parsed.ministry.leader &&
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

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Ministerio no válido" },
        { status: 400 }
      )
    }

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
