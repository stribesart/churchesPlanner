import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

const dbName = "churchesPlanner"

export async function GET() {
  const client = await clientPromise
  const db = client.db(dbName)

  const events = await db.collection("events").find().toArray()

  return NextResponse.json(events)
}

export async function POST(req: Request) {
  const { name, description, date, startTime, endTime, location, organizer } = await req.json()

  const client = await clientPromise
  const db = client.db(dbName)

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
    eventId: eventResult.insertedId
  })
}