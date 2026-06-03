import { NextResponse } from "next/server"
import { getTenantFromRequest, getTenantDbByName } from "@/lib/tenant"
import { ObjectId } from "mongodb"

function parseEventInput(body: Record<string, unknown>) {
  const name = typeof body.name === "string" ? body.name.trim() : ""
  const description =
    typeof body.description === "string" ? body.description.trim() : ""
  const date = typeof body.date === "string" ? body.date.trim() : ""
  const startTime =
    typeof body.startTime === "string" ? body.startTime.trim() : ""
  const endTime = typeof body.endTime === "string" ? body.endTime.trim() : ""
  const location =
    typeof body.location === "string" ? body.location.trim() : ""
  const organizer =
    typeof body.organizer === "string" ? body.organizer.trim() : ""
  const requiresRegistration = body.requiresRegistration === true
  const isPaidEvent = body.isPaidEvent === true
  const expectedAttendees =
    body.expectedAttendees === null ||
    body.expectedAttendees === undefined ||
    body.expectedAttendees === ""
      ? null
      : Number(body.expectedAttendees)
  const paymentAmount = isPaidEvent ? Number(body.paymentAmount) : null
  const paymentMethod =
    body.paymentMethod === "card" || body.paymentMethod === "transfer"
      ? body.paymentMethod
      : "transfer"

  if (!name) return { ok: false as const, message: "El nombre del evento es obligatorio" }
  if (!date) return { ok: false as const, message: "Selecciona la fecha del evento" }
  if (!startTime) return { ok: false as const, message: "Selecciona la hora de inicio" }
  if (!endTime) return { ok: false as const, message: "Selecciona la hora de fin" }
  if (startTime >= endTime) {
    return {
      ok: false as const,
      message: "La hora de fin debe ser posterior a la hora de inicio",
    }
  }
  if (!location) return { ok: false as const, message: "La ubicación es obligatoria" }
  if (!organizer || !ObjectId.isValid(organizer)) {
    return { ok: false as const, message: "Selecciona un organizador válido" }
  }
  if (
    expectedAttendees !== null &&
    (!Number.isInteger(expectedAttendees) || expectedAttendees <= 0)
  ) {
    return {
      ok: false as const,
      message: "Ingresa un número de asistentes esperado mayor a 0",
    }
  }
  if (isPaidEvent && (!Number.isFinite(paymentAmount) || paymentAmount <= 0)) {
    return { ok: false as const, message: "Ingresa un monto mayor a 0" }
  }

  return {
    ok: true as const,
    event: {
      name,
      description,
      date,
      startTime,
      endTime,
      location,
      organizer,
      requiresRegistration,
      isPaidEvent,
      expectedAttendees,
      paymentAmount,
      paymentMethod: isPaidEvent ? paymentMethod : null,
    },
  }
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
        { message: "Evento no válido" },
        { status: 400 }
      )
    }

    const body = await req.json()
    const parsed = parseEventInput(body)

    if (!parsed.ok) {
      return NextResponse.json({ message: parsed.message }, { status: 400 })
    }

    const db = await getTenantDbByName(tenantDbName)
    const organizerUser = await db.collection("users").findOne({
      _id: new ObjectId(parsed.event.organizer),
    })

    if (!organizerUser) {
      return NextResponse.json(
        { message: "Organizador no encontrado" },
        { status: 404 }
      )
    }

    const result = await db.collection("events").updateOne(
      { _id: new ObjectId(id) },
      { $set: parsed.event }
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

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Evento no válido" },
        { status: 400 }
      )
    }

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
