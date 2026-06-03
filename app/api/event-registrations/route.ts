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

function getPaymentAmount(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
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
  const scope = searchParams.get("scope")?.trim()

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

  if ((eventId || scope === "all") && !userCanViewEventRegistrations) {
    return NextResponse.json(
      { message: "Acceso denegado" },
      { status: 403 }
    )
  }

  const registrations = await db
    .collection("eventRegistrations")
    .find({
      ...(eventId ? { eventId } : {}),
      ...(scope !== "all" && (!eventId || !userCanViewEventRegistrations)
        ? { userId }
        : {}),
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

  if (event.requiresRegistration === true && !parsed.registration.contact) {
    return NextResponse.json(
      { message: "El contacto es obligatorio" },
      { status: 400 }
    )
  }

  const userId = currentUser.user._id.toString()
  const currentUserEmail =
    typeof currentUser.user.email === "string"
      ? currentUser.user.email.trim().toLowerCase()
      : ""
  const now = new Date()

  if (parsed.registration.email !== currentUserEmail) {
    return NextResponse.json(
      { message: "El correo del registro debe ser el de la sesión actual" },
      { status: 400 }
    )
  }

  const existingEmailRegistration = await db.collection("eventRegistrations").findOne({
    eventId: parsed.registration.eventId,
    email: parsed.registration.email,
    name: parsed.registration.name,
  })

  if (existingEmailRegistration) {
    if (existingEmailRegistration.userId !== userId) {
      return NextResponse.json(
        { message: "Este registro ya existe para el evento" },
        { status: 409 }
      )
    }

    const isSameRegisteredPerson =
      typeof existingEmailRegistration.email === "string" &&
      existingEmailRegistration.email === parsed.registration.email &&
      typeof existingEmailRegistration.name === "string" &&
      existingEmailRegistration.name === parsed.registration.name

    if (!isSameRegisteredPerson) {
      return NextResponse.json(
        { message: "Este registro ya existe para el evento" },
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
      name: parsed.registration.name,
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

  if (paymentStatus === "paid") {
    const paidRegistration = await db.collection("eventRegistrations").findOne({
      eventId: parsed.registration.eventId,
      email: parsed.registration.email,
      name: parsed.registration.name,
    })

    await db.collection("eventPayments").insertOne({
      eventId: parsed.registration.eventId,
      eventName: typeof event.name === "string" ? event.name : "Evento",
      paidByUserId: userId,
      paidByName: getUserDisplayName(currentUser.user),
      paidByEmail: currentUserEmail,
      paymentMethod: parsed.registration.paymentMethod,
      quantity: 1,
      amountPerPerson: paymentAmount,
      totalAmount: getPaymentAmount(paymentAmount),
      registrationIds: paidRegistration ? [paidRegistration._id] : [],
      registrations: paidRegistration
        ? [
            {
              registrationId: paidRegistration._id,
              name: paidRegistration.name,
              email: paidRegistration.email,
              contact: paidRegistration.contact,
            },
          ]
        : [],
      createdAt: now,
    })
  }

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

export async function PATCH(req: Request) {
  const currentUser = await getCurrentTenantUser(req)

  if (!currentUser) {
    return NextResponse.json(
      { message: "Acceso denegado" },
      { status: 401 }
    )
  }

  const body = await req.json()
  const eventId = typeof body.eventId === "string" ? body.eventId.trim() : ""
  const quantity = Number(body.quantity)
  const paymentMethod =
    typeof body.paymentMethod === "string" &&
    paymentMethods.includes(body.paymentMethod as (typeof paymentMethods)[number])
      ? body.paymentMethod
      : null

  if (!eventId || !ObjectId.isValid(eventId)) {
    return NextResponse.json(
      { message: "Evento no válido" },
      { status: 400 }
    )
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return NextResponse.json(
      { message: "Selecciona cuántas personas quieres pagar" },
      { status: 400 }
    )
  }

  if (!paymentMethod) {
    return NextResponse.json(
      { message: "Selecciona un método de pago válido" },
      { status: 400 }
    )
  }

  const userEmail =
    typeof currentUser.user.email === "string"
      ? currentUser.user.email.trim().toLowerCase()
      : ""

  if (!userEmail) {
    return NextResponse.json(
      { message: "No se pudo identificar el correo de la sesión" },
      { status: 400 }
    )
  }

  const db = await getTenantDbByName(currentUser.tenantDbName)
  const pendingRegistrations = await db
    .collection("eventRegistrations")
    .find({
      eventId,
      email: userEmail,
      paymentStatus: "pending",
      paymentPending: true,
    })
    .sort({ createdAt: 1 })
    .limit(quantity)
    .toArray()

  if (pendingRegistrations.length === 0) {
    return NextResponse.json(
      { message: "No hay pagos pendientes para este evento" },
      { status: 400 }
    )
  }

  if (pendingRegistrations.length < quantity) {
    return NextResponse.json(
      { message: "La cantidad excede los pagos pendientes disponibles" },
      { status: 400 }
    )
  }

  const now = new Date()
  const event = await db.collection("events").findOne({
    _id: new ObjectId(eventId),
  })
  const amountPerPerson = getPaymentAmount(event?.paymentAmount)
  const result = await db.collection("eventRegistrations").updateMany(
    {
      _id: { $in: pendingRegistrations.map((registration) => registration._id) },
    },
    {
      $set: {
        paymentMethod,
        paymentStatus: "paid",
        paymentPending: false,
        paidAt: now,
        updatedAt: now,
      },
    }
  )

  await db.collection("eventPayments").insertOne({
    eventId,
    eventName: typeof event?.name === "string" ? event.name : "Evento",
    paidByUserId: currentUser.user._id.toString(),
    paidByName: getUserDisplayName(currentUser.user),
    paidByEmail: userEmail,
    paymentMethod,
    quantity: result.modifiedCount,
    amountPerPerson,
    totalAmount: amountPerPerson * result.modifiedCount,
    registrationIds: pendingRegistrations.map((registration) => registration._id),
    registrations: pendingRegistrations.map((registration) => ({
      registrationId: registration._id,
      name: registration.name,
      email: registration.email,
      contact: registration.contact,
    })),
    createdAt: now,
  })

  return NextResponse.json({
    message:
      result.modifiedCount === 1
        ? "Pago de 1 persona registrado"
        : `Pago de ${result.modifiedCount} personas registrado`,
    paidCount: result.modifiedCount,
  })
}
