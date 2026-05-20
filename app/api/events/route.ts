import { NextResponse } from "next/server"
import { getTenantFromRequest, getTenantDbByName } from "@/lib/tenant"

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

  return NextResponse.json(events)
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