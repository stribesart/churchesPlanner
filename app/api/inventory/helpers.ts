import { ObjectId, type Db } from "mongodb"

export const inventoryConditions = ["new", "good", "regular", "damaged"] as const
export const inventoryStatuses = [
  "available",
  "in_use",
  "maintenance",
  "lost",
  "retired",
] as const

export type InventoryCondition = (typeof inventoryConditions)[number]
export type InventoryStatus = (typeof inventoryStatuses)[number]

export type InventoryInput = {
  name: string
  quantity: number
  condition: InventoryCondition
  status: InventoryStatus
  location: string
  ministryId: string | null
  assignedTo: string | null
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

export function isPastorRole(role: unknown) {
  const normalizedRole = normalizeRole(role)

  return normalizedRole === "pastor" || normalizedRole === "admin"
}

export function isLeaderRole(role: unknown) {
  return normalizeRole(role) === "lider"
}

export function canAccessInventory(role: unknown) {
  return isPastorRole(role) || isLeaderRole(role)
}

export function getCurrentMinistryId(ministryId: unknown) {
  return typeof ministryId === "string" && ministryId.trim()
    ? ministryId
    : null
}

function validateCondition(condition: unknown): InventoryCondition {
  if (
    typeof condition === "string" &&
    inventoryConditions.includes(condition as InventoryCondition)
  ) {
    return condition as InventoryCondition
  }

  return "good"
}

function validateStatus(status: unknown): InventoryStatus {
  if (
    typeof status === "string" &&
    inventoryStatuses.includes(status as InventoryStatus)
  ) {
    return status as InventoryStatus
  }

  return "available"
}

export function parseInventoryInput(body: Record<string, unknown>) {
  const name = typeof body.name === "string" ? body.name.trim() : ""
  const quantity = Number(body.quantity)
  const ministryId =
    typeof body.ministryId === "string" && body.ministryId.trim()
      ? body.ministryId.trim()
      : null
  const assignedTo =
    typeof body.assignedTo === "string" && body.assignedTo.trim()
      ? body.assignedTo.trim()
      : null

  if (!name) {
    return { ok: false as const, message: "El nombre es obligatorio" }
  }

  if (!Number.isInteger(quantity) || quantity < 0) {
    return {
      ok: false as const,
      message: "La cantidad debe ser un número entero mayor o igual a 0",
    }
  }

  if (ministryId && !ObjectId.isValid(ministryId)) {
    return { ok: false as const, message: "Selecciona un ministerio válido" }
  }

  if (assignedTo && !ObjectId.isValid(assignedTo)) {
    return { ok: false as const, message: "Selecciona un responsable válido" }
  }

  return {
    ok: true as const,
    item: {
      name,
      quantity,
      condition: validateCondition(body.condition),
      status: validateStatus(body.status),
      location: typeof body.location === "string" ? body.location.trim() : "",
      ministryId,
      assignedTo,
      notes: typeof body.notes === "string" ? body.notes.trim() : "",
    } satisfies InventoryInput,
  }
}

export async function validateInventoryRelations(db: Db, item: InventoryInput) {
  if (item.ministryId) {
    const ministry = await db.collection("ministeries").findOne({
      $or: [
        { ministryId: item.ministryId },
        { _id: new ObjectId(item.ministryId) },
      ],
    })

    if (!ministry) {
      return { ok: false as const, message: "Ministerio no encontrado" }
    }
  }

  if (item.assignedTo) {
    const user = await db.collection("users").findOne({
      _id: new ObjectId(item.assignedTo),
    })

    if (!user) {
      return { ok: false as const, message: "Responsable no encontrado" }
    }
  }

  return { ok: true as const }
}

export function getInventoryReadFilter(role: unknown, ministryId: string | null) {
  if (isPastorRole(role)) {
    return {}
  }

  if (isLeaderRole(role)) {
    return {
      $or: [
        { ministryId: { $exists: false } },
        { ministryId: null },
        { ministryId: "" },
        ...(ministryId ? [{ ministryId }] : []),
      ],
    }
  }

  return null
}

export function canWriteInventoryItem({
  role,
  currentMinistryId,
  itemMinistryId,
}: {
  role: unknown
  currentMinistryId: string | null
  itemMinistryId: string | null
}) {
  if (isPastorRole(role)) {
    return true
  }

  return isLeaderRole(role) && Boolean(currentMinistryId) && itemMinistryId === currentMinistryId
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

export async function enrichInventoryItems<T extends Record<string, unknown>>(
  db: Db,
  items: T[]
) {
  const userIds = Array.from(
    new Set(
      items.flatMap((item) =>
        ["assignedTo", "createdBy", "updatedBy"]
          .map((field) => item[field])
          .filter(
            (value): value is string =>
              typeof value === "string" && ObjectId.isValid(value)
          )
      )
    )
  )
  const ministryIds = Array.from(
    new Set(
      items
        .map((item) => item.ministryId)
        .filter(
          (value): value is string =>
            typeof value === "string" && ObjectId.isValid(value)
        )
    )
  )
  const [users, ministeries] = await Promise.all([
    userIds.length > 0
      ? db
          .collection("users")
          .find({ _id: { $in: userIds.map((id) => new ObjectId(id)) } })
          .toArray()
      : [],
    ministryIds.length > 0
      ? db
          .collection("ministeries")
          .find({
            $or: [
              { ministryId: { $in: ministryIds } },
              { _id: { $in: ministryIds.map((id) => new ObjectId(id)) } },
            ],
          })
          .toArray()
      : [],
  ])
  const usersById = new Map(
    users.map((user) => [user._id.toString(), user] as const)
  )
  const ministeriesById = new Map<string, Record<string, unknown>>()

  ministeries.forEach((ministry) => {
    ministeriesById.set(ministry._id.toString(), ministry)

    if (typeof ministry.ministryId === "string") {
      ministeriesById.set(ministry.ministryId, ministry)
    }
  })

  return items.map((item) => {
    const assignedTo =
      typeof item.assignedTo === "string"
        ? usersById.get(item.assignedTo)
        : null
    const createdBy =
      typeof item.createdBy === "string" ? usersById.get(item.createdBy) : null
    const updatedBy =
      typeof item.updatedBy === "string" ? usersById.get(item.updatedBy) : null
    const ministry =
      typeof item.ministryId === "string"
        ? ministeriesById.get(item.ministryId)
        : null

    return {
      ...item,
      assignedToName: getUserDisplayName(assignedTo),
      createdByName: getUserDisplayName(createdBy),
      updatedByName: getUserDisplayName(updatedBy),
      ministryName:
        ministry && typeof ministry.name === "string" ? ministry.name : "",
    }
  })
}
