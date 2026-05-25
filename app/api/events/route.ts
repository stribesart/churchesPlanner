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

  return NextResponse.json(eventsWithOrganizerName)
}

export async function POST(req: Request) {
  const tenantDbName = await getTenantFromRequest(req)

  if (!tenantDbName) {
    return NextResponse.json(
      { message: "Acceso denegado" },
      { status: 401 }
    )
  }

  const { name, description, date, startTime, endTime, location, organizer } = await req.json()
  const db = await getTenantDbByName(tenantDbName)

  const newEvent = {
    name,
    description,
    date,
    startTime,
    endTime,
    location,
    organizer,
    createdAt: new Date(),
  }

  const eventResult = await db.collection("events").insertOne(newEvent)

  // Crear anuncio automáticamente
  const newAnnouncement = {
    title: `Nuevo evento: ${name}`,
    content: `Se ha programado un nuevo evento: ${name}. ${description ? `Descripción: ${description}` : ""} Fecha: ${date} a las ${startTime}. Ubicación: ${location}`,
    author: organizer || "Sistema",
    createdAt: new Date(),
  }

  await db.collection("announcements").insertOne(newAnnouncement)

  return NextResponse.json({
    message: "Evento creado y anuncio generado",
    eventId: eventResult.insertedId,
  })
}
