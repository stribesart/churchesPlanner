import { NextResponse } from "next/server"
import { getTenantFromRequest, getTenantDbByName } from "@/lib/tenant"
import { ObjectId } from "mongodb"

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

    const { name, description, date, startTime, endTime, location, organizer } = await req.json()
    const db = await getTenantDbByName(tenantDbName)

    const updateData: { 
      name?: string
      description?: string
      date?: string
      startTime?: string
      endTime?: string
      location?: string
      organizer?: string
    } = {}

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (date !== undefined) updateData.date = date
    if (startTime !== undefined) updateData.startTime = startTime
    if (endTime !== undefined) updateData.endTime = endTime
    if (location !== undefined) updateData.location = location
    if (organizer !== undefined) updateData.organizer = organizer

    const result = await db.collection("events").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Evento no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: "Evento actualizado" })

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

    const result = await db.collection("events").deleteOne({
      _id: new ObjectId(id),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Evento no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: "Evento eliminado" })

  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { message: "Error interno" },
      { status: 500 }
    )
  }
}