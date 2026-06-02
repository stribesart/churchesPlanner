import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"

import { getCurrentTenantUser, getTenantDbByName } from "@/lib/tenant"

const paymentMethods = ["transfer", "card"] as const

function canViewEventRegistrations(role: unknown) {
  if (typeof role !== "string") return false

  const normalizedRole = role
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  return ["administrador", "admin", "pastor"].includes(normalizedRole)
}

function getUserDisplayName(user: Record<string, unknown>) {
  const fields = ["name", "realName", "displayName", "email"]

  for (const field of fields) {
    const value = user[field]

    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }

  return "Usuario"
}

function parseRegistrationInput(body: Record<string, unknown>) {
  const eventId = typeof body.eventId === "string" ? body.eventId.trim() : ""
  const name = typeof body.name === "string" ? body.name.trim() : ""
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const contact = typeof body.contact === "string" ? body.contact.trim() : ""
  const paymentMethod =
    typeof body.paymentMethod === "string" &&
    paymentMethods.includes(body.paymentMethod as (typeof paymentMethods)[number])
      ? body.paymentMethod
      : null
  const markAsPaid = body.markAsPaid === true

  if (!eventId || !ObjectId.isValid(eventId)) {
    return { ok: false as const, message: "Evento no válido" }
  }

  if (!name) return { ok: false as const, message: "El nombre es obligatorio" }
  if (!email) return { ok: false as const, message: "El correo es obligatorio" }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false as const, message: "Ingresa un correo válido" }
  }
  if (!markAsPaid && !contact) {
    return { ok: false as const, message: "El contacto es obligatorio" }
  }

  return {
    ok: true as const,
    registration: {
      eventId,
      name,
      email,
      contact,
      paymentMethod,
      markAsPaid,
    },
  }
}

export async function GET(req: Request) {
  const currentUser = await getCurrentTenantUser(req)

  if (!currentUser) {
    return NextResponse.json(
      { message: "Acceso denegado" },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get("eventId")?.trim()

  if (eventId && !ObjectId.isValid(eventId)) {
    return NextResponse.json(
      { message: "Evento no válido" },
      { status: 400 }
    )
  }

  const db = await getTenantDbByName(currentUser.tenantDbName)
  const userId = currentUser.user._id.toString()
  const userCanViewEventRegistrations = canViewEventRegistrations(
    currentUser.user.role
  )

  if (eventId && !userCanViewEventRegistrations) {
    return NextResponse.json(
      { message: "Acceso denegado" },
      { status: 403 }
    )
  }

  const registrations = await db
    .collection("eventRegistrations")
    .find({
      ...(eventId ? { eventId } : {}),
      ...(!eventId || !userCanViewEventRegistrations ? { userId } : {}),
    })
    .sort({ createdAt: -1 })
    .toArray()

  return NextResponse.json({ registrations })
}

export async function POST(req: Request) {
  const currentUser = await getCurrentTenantUser(req)

  if (!currentUser) {
    return NextResponse.json(
      { message: "Acceso denegado" },
      { status: 401 }
    )
  }

  const body = await req.json()
  const parsed = parseRegistrationInput(body)

  if (!parsed.ok) {
    return NextResponse.json({ message: parsed.message }, { status: 400 })
  }

  const db = await getTenantDbByName(currentUser.tenantDbName)
  const event = await db.collection("events").findOne({
    _id: new ObjectId(parsed.registration.eventId),
  })

  if (!event) {
    return NextResponse.json(
      { message: "Evento no encontrado" },
      { status: 404 }
    )
  }

  const userId = currentUser.user._id.toString()
  const now = new Date()
  const existingEmailRegistration = await db.collection("eventRegistrations").findOne({
    eventId: parsed.registration.eventId,
    email: parsed.registration.email,
  })

  if (existingEmailRegistration) {
    if (existingEmailRegistration.userId !== userId) {
      return NextResponse.json(
        { message: "Este correo ya está registrado para el evento" },
        { status: 409 }
      )
    }

    const isSameRegisteredPerson =
      typeof existingEmailRegistration.email === "string" &&
      existingEmailRegistration.email === parsed.registration.email

    if (!isSameRegisteredPerson) {
      return NextResponse.json(
        { message: "Este correo ya está registrado para el evento" },
        { status: 409 }
      )
    }
  }

  const eventIsPaid = event.isPaidEvent === true
  const paymentAmount =
    typeof event.paymentAmount === "number" && Number.isFinite(event.paymentAmount)
      ? event.paymentAmount
      : null
  const paymentStatus =
    eventIsPaid && parsed.registration.markAsPaid ? "paid" : eventIsPaid ? "pending" : "not_required"
  const paymentPending = paymentStatus === "pending"

  const result = await db.collection("eventRegistrations").updateOne(
    {
      eventId: parsed.registration.eventId,
      email: parsed.registration.email,
    },
    {
      $set: {
        eventId: parsed.registration.eventId,
        eventName: typeof event.name === "string" ? event.name : "Evento",
        userId,
        userName: getUserDisplayName(currentUser.user),
        name: parsed.registration.name,
        email: parsed.registration.email,
        contact: parsed.registration.contact,
        paymentRequired: eventIsPaid,
        paymentAmount,
        paymentMethod: eventIsPaid ? parsed.registration.paymentMethod : null,
        paymentStatus,
        paymentPending,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true }
  )

  return NextResponse.json(
    {
      message:
        paymentStatus === "paid"
          ? "Pago registrado"
          : paymentStatus === "pending"
            ? "Pago incompleto"
          : "Registro guardado",
      registrationId: result.upsertedId,
      paymentPending,
      paymentStatus,
    },
    { status: 201 }
  )
}
