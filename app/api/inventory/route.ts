import { NextResponse } from "next/server"

import { getCurrentTenantUser, getTenantDbByName } from "@/lib/tenant"
import {
  canAccessInventory,
  canWriteInventoryItem,
  enrichInventoryItems,
  getCurrentMinistryId,
  getInventoryReadFilter,
  parseInventoryInput,
  validateInventoryRelations,
} from "@/app/api/inventory/helpers"

export async function GET(req: Request) {
  const currentUser = await getCurrentTenantUser(req)

  if (!currentUser) {
    return NextResponse.json(
      { message: "Acceso denegado" },
      { status: 401 }
    )
  }

  if (!canAccessInventory(currentUser.user.role)) {
    return NextResponse.json(
      { message: "No tienes acceso al inventario" },
      { status: 403 }
    )
  }

  const currentMinistryId = getCurrentMinistryId(currentUser.user.ministryId)
  const filter = getInventoryReadFilter(currentUser.user.role, currentMinistryId)

  if (!filter) {
    return NextResponse.json(
      { message: "No tienes acceso al inventario" },
      { status: 403 }
    )
  }

  const db = await getTenantDbByName(currentUser.tenantDbName)
  const items = await db
    .collection("inventory")
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray()
  const enrichedItems = await enrichInventoryItems(db, items)

  return NextResponse.json({ items: enrichedItems })
}

export async function POST(req: Request) {
  const currentUser = await getCurrentTenantUser(req)

  if (!currentUser) {
    return NextResponse.json(
      { message: "Acceso denegado" },
      { status: 401 }
    )
  }

  if (!canAccessInventory(currentUser.user.role)) {
    return NextResponse.json(
      { message: "No tienes acceso al inventario" },
      { status: 403 }
    )
  }

  const body = await req.json()
  const parsed = parseInventoryInput(body)

  if (!parsed.ok) {
    return NextResponse.json({ message: parsed.message }, { status: 400 })
  }

  const currentMinistryId = getCurrentMinistryId(currentUser.user.ministryId)

  if (
    !canWriteInventoryItem({
      role: currentUser.user.role,
      currentMinistryId,
      itemMinistryId: parsed.item.ministryId,
    })
  ) {
    return NextResponse.json(
      { message: "Solo puedes crear inventario de tu ministerio" },
      { status: 403 }
    )
  }

  const db = await getTenantDbByName(currentUser.tenantDbName)
  const relations = await validateInventoryRelations(db, parsed.item)

  if (!relations.ok) {
    return NextResponse.json({ message: relations.message }, { status: 400 })
  }

  const result = await db.collection("inventory").insertOne({
    ...parsed.item,
    createdBy: currentUser.user._id.toString(),
    createdAt: new Date(),
  })

  return NextResponse.json(
    {
      message: "Inventario creado",
      itemId: result.insertedId,
    },
    { status: 201 }
  )
}
