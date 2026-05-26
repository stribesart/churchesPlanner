import { ObjectId, type Db } from "mongodb"

export const offeringTypes = [
  "voluntary",
  "event",
  "tithe",
  "special",
  "other",
] as const
export const offeringSources = [
  "registered_user",
  "anonymous",
  "manual",
  "self_service",
] as const
export const paymentMethods = ["cash", "transfer", "card", "other"] as const
export const paymentProviders = ["manual", "mock"] as const
export const paymentStatuses = ["paid", "pending", "failed"] as const
export const entrySources = ["admin", "self_service"] as const

export type OfferingType = (typeof offeringTypes)[number]
export type OfferingSource = (typeof offeringSources)[number]
export type PaymentMethod = (typeof paymentMethods)[number]
export type PaymentProvider = (typeof paymentProviders)[number]
export type PaymentStatus = (typeof paymentStatuses)[number]
export type EntrySource = (typeof entrySources)[number]

export type OfferingInput = {
  amount: number
  currency: string
  type: OfferingType
  source: OfferingSource
  eventId: string | null
  userId: string | null
  donorName: string
  paymentMethod: PaymentMethod
  paymentProvider: PaymentProvider
  providerPaymentId: string | null
  paymentStatus: PaymentStatus
  entrySource: EntrySource
  notes: string
}

export function normalizeRole(role: unknown) {
  if (typeof role !== "string") return ""

  const normalizedRole = role
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  return normalizedRole === "administrador" ? "pastor" : normalizedRole
}

export function canManageOfferings(role: unknown) {
  const normalizedRole = normalizeRole(role)

  return normalizedRole === "pastor" || normalizedRole === "admin"
}

function getOfferingType(value: unknown): OfferingType {
  if (typeof value === "string" && offeringTypes.includes(value as OfferingType)) {
    return value as OfferingType
  }

  return "voluntary"
}

function getOfferingSource(value: unknown): OfferingSource {
  if (typeof value === "string" && offeringSources.includes(value as OfferingSource)) {
    return value as OfferingSource
  }

  return "manual"
}

function getPaymentMethod(value: unknown): PaymentMethod {
  if (typeof value === "string" && paymentMethods.includes(value as PaymentMethod)) {
    return value as PaymentMethod
  }

  return "cash"
}

function getPaymentProvider(value: unknown): PaymentProvider {
  if (
    typeof value === "string" &&
    paymentProviders.includes(value as PaymentProvider)
  ) {
    return value as PaymentProvider
  }

  return "manual"
}

function getPaymentStatus(value: unknown): PaymentStatus {
  if (
    typeof value === "string" &&
    paymentStatuses.includes(value as PaymentStatus)
  ) {
    return value as PaymentStatus
  }

  return "paid"
}

function getEntrySource(value: unknown): EntrySource {
  if (typeof value === "string" && entrySources.includes(value as EntrySource)) {
    return value as EntrySource
  }

  return "admin"
}

function parseOptionalObjectId(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null
  }

  const id = value.trim()

  return ObjectId.isValid(id) ? id : "invalid"
}

export function parseOfferingInput(body: Record<string, unknown>) {
  const amount = Number(body.amount)
  const type = getOfferingType(body.type)
  const source = getOfferingSource(body.source)
  const eventId = parseOptionalObjectId(body.eventId)
  const userId = parseOptionalObjectId(body.userId)

  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false as const, message: "El monto debe ser mayor a 0" }
  }

  if (eventId === "invalid") {
    return { ok: false as const, message: "Selecciona un evento válido" }
  }

  if (userId === "invalid") {
    return { ok: false as const, message: "Selecciona un usuario válido" }
  }

  if (type === "event" && !eventId) {
    return {
      ok: false as const,
      message: "Selecciona un evento para esta ofrenda",
    }
  }

  if (source === "registered_user" && !userId) {
    return {
      ok: false as const,
      message: "Selecciona el usuario que realizó la ofrenda",
    }
  }

  return {
    ok: true as const,
    offering: {
      amount,
      currency:
        typeof body.currency === "string" && body.currency.trim()
          ? body.currency.trim().toUpperCase()
          : "MXN",
      type,
      source,
      eventId,
      userId,
      donorName:
        typeof body.donorName === "string" && body.donorName.trim()
          ? body.donorName.trim()
          : source === "anonymous"
            ? "Anónimo"
            : "",
      paymentMethod: getPaymentMethod(body.paymentMethod),
      paymentProvider: getPaymentProvider(body.paymentProvider),
      providerPaymentId:
        typeof body.providerPaymentId === "string" && body.providerPaymentId.trim()
          ? body.providerPaymentId.trim()
          : null,
      paymentStatus: getPaymentStatus(body.paymentStatus),
      entrySource: getEntrySource(body.entrySource),
      notes: typeof body.notes === "string" ? body.notes.trim() : "",
    } satisfies OfferingInput,
  }
}

export async function validateOfferingRelations(db: Db, offering: OfferingInput) {
  if (offering.eventId) {
    const event = await db.collection("events").findOne({
      _id: new ObjectId(offering.eventId),
    })

    if (!event) {
      return { ok: false as const, message: "Evento no encontrado" }
    }
  }

  if (offering.userId) {
    const user = await db.collection("users").findOne({
      _id: new ObjectId(offering.userId),
    })

    if (!user) {
      return { ok: false as const, message: "Usuario no encontrado" }
    }
  }

  return { ok: true as const }
}

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

export async function enrichOfferings<T extends Record<string, unknown>>(
  db: Db,
  offerings: T[]
) {
  const userIds = Array.from(
    new Set(
      offerings.flatMap((offering) =>
        ["userId", "recordedBy", "updatedBy"]
          .map((field) => offering[field])
          .filter(
            (value): value is string =>
              typeof value === "string" && ObjectId.isValid(value)
          )
      )
    )
  )
  const eventIds = Array.from(
    new Set(
      offerings
        .map((offering) => offering.eventId)
        .filter(
          (value): value is string =>
            typeof value === "string" && ObjectId.isValid(value)
        )
    )
  )
  const [users, events] = await Promise.all([
    userIds.length > 0
      ? db
          .collection("users")
          .find({ _id: { $in: userIds.map((id) => new ObjectId(id)) } })
          .toArray()
      : [],
    eventIds.length > 0
      ? db
          .collection("events")
          .find({ _id: { $in: eventIds.map((id) => new ObjectId(id)) } })
          .toArray()
      : [],
  ])
  const usersById = new Map(
    users.map((user) => [user._id.toString(), user] as const)
  )
  const eventsById = new Map(
    events.map((event) => [event._id.toString(), event] as const)
  )

  return offerings.map((offering) => {
    const user =
      typeof offering.userId === "string"
        ? usersById.get(offering.userId)
        : null
    const recordedBy =
      typeof offering.recordedBy === "string"
        ? usersById.get(offering.recordedBy)
        : null
    const updatedBy =
      typeof offering.updatedBy === "string"
        ? usersById.get(offering.updatedBy)
        : null
    const event =
      typeof offering.eventId === "string"
        ? eventsById.get(offering.eventId)
        : null

    return {
      ...offering,
      userName: getUserDisplayName(user),
      recordedByName: getUserDisplayName(recordedBy),
      updatedByName: getUserDisplayName(updatedBy),
      eventName: event && typeof event.name === "string" ? event.name : "",
    }
  })
}
