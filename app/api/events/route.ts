import { NextResponse } from "next/server"
import { getTenantFromRequest, getTenantDbByName } from "@/lib/tenant"
import { ObjectId } from "mongodb"

function getUserDisplayName(user: unknown) {
  if (!user || typeof user !== "object") return ""

  const fields = ["name", "realName", "displayName", "email"]

  for (const field of fields) {
    const value = (user as Record<string, unknown>)[field]

    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }

  return ""
}

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

export async function GET(req: Request) {
  const tenantDbName = await getTenantFromRequest(req)

  if (!tenantDbName) {
    return NextResponse.json(
      { message: "Acceso denegado" },
      { status: 401 }
    )
  }

  const db = await getTenantDbByName(tenantDbName)
  const events = await db.collection("events").find().toArray()
  const organizerIds = Array.from(
    new Set(
      events
        .map((event) => event.organizer)
        .filter(
          (organizer): organizer is string =>
            typeof organizer === "string" && ObjectId.isValid(organizer)
        )
    )
  )
  const organizers =
    organizerIds.length > 0
      ? await db
          .collection("users")
          .find({ _id: { $in: organizerIds.map((id) => new ObjectId(id)) } })
          .toArray()
      : []
  const organizersById = new Map(
    organizers.map((organizer) => [organizer._id.toString(), organizer])
  )
  const eventsWithOrganizerName = events.map((event) => {
    const organizer =
      typeof event.organizer === "string"
        ? organizersById.get(event.organizer)
        : null
    const organizerName = getUserDisplayName(organizer)

    return {
      ...event,
      organizerName:
        organizerName ||
        (typeof event.organizer === "string" &&
        event.organizer.trim() &&
        !ObjectId.isValid(event.organizer)
          ? event.organizer
          : "Sin organizador"),
    }
  })
  const eventIds = events.map((event) => event._id.toString())
  const registrationsByEvent =
    eventIds.length > 0
      ? await db
          .collection("eventRegistrations")
          .aggregate<{ _id: string; count: number }>([
            { $match: { eventId: { $in: eventIds } } },
            { $group: { _id: "$eventId", count: { $sum: 1 } } },
          ])
          .toArray()
      : []
  const registrationCountsByEvent = new Map(
    registrationsByEvent.map((registration) => [
      registration._id,
      registration.count,
    ])
  )
  const eventsWithRegistrationCount = eventsWithOrganizerName.map((event) => ({
    ...event,
    registrationsCount: registrationCountsByEvent.get(event._id.toString()) || 0,
  }))

  return NextResponse.json(eventsWithRegistrationCount)
}

export async function POST(req: Request) {
  const tenantDbName = await getTenantFromRequest(req)

  if (!tenantDbName) {
    return NextResponse.json(
      { message: "Acceso denegado" },
      { status: 401 }
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

  const newEvent = {
    ...parsed.event,
    createdAt: new Date(),
  }

  const eventResult = await db.collection("events").insertOne(newEvent)

  // Crear anuncio automáticamente
  const newAnnouncement = {
    title: `Nuevo evento: ${parsed.event.name}`,
    content: `Se ha programado un nuevo evento: ${parsed.event.name}. ${parsed.event.description ? `Descripción: ${parsed.event.description}` : ""} Fecha: ${parsed.event.date} a las ${parsed.event.startTime}. Ubicación: ${parsed.event.location}${parsed.event.requiresRegistration ? ". Requiere registro" : ""}${parsed.event.isPaidEvent ? `. Evento de pago: $${parsed.event.paymentAmount} MXN` : ""}`,
    author: parsed.event.organizer,
    createdAt: new Date(),
  }

  await db.collection("announcements").insertOne(newAnnouncement)

  return NextResponse.json({
    message: "Evento creado y anuncio generado",
    eventId: eventResult.insertedId,
  })
}
