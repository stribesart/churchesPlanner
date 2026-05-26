import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"

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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: "Inventario no válido" },
      { status: 400 }
    )
  }

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
  const readFilter = getInventoryReadFilter(currentUser.user.role, currentMinistryId)

  if (!readFilter) {
    return NextResponse.json(
      { message: "No tienes acceso al inventario" },
      { status: 403 }
    )
  }

  const db = await getTenantDbByName(currentUser.tenantDbName)
  const item = await db.collection("inventory").findOne({
    _id: new ObjectId(id),
    ...readFilter,
  })

  if (!item) {
    return NextResponse.json(
      { message: "Inventario no encontrado" },
      { status: 404 }
    )
  }

  const [enrichedItem] = await enrichInventoryItems(db, [item])

  return NextResponse.json({ item: enrichedItem })
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: "Inventario no válido" },
      { status: 400 }
    )
  }

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

  const db = await getTenantDbByName(currentUser.tenantDbName)
  const itemId = new ObjectId(id)
  const existingItem = await db.collection("inventory").findOne({ _id: itemId })

  if (!existingItem) {
    return NextResponse.json(
      { message: "Inventario no encontrado" },
      { status: 404 }
    )
  }

  const currentMinistryId = getCurrentMinistryId(currentUser.user.ministryId)

  if (
    !canWriteInventoryItem({
      role: currentUser.user.role,
      currentMinistryId,
      itemMinistryId:
        typeof existingItem.ministryId === "string" && existingItem.ministryId
          ? existingItem.ministryId
          : null,
    })
  ) {
    return NextResponse.json(
      { message: "Solo puedes modificar inventario de tu ministerio" },
      { status: 403 }
    )
  }

  const body = await req.json()
  const parsed = parseInventoryInput(body)

  if (!parsed.ok) {
    return NextResponse.json({ message: parsed.message }, { status: 400 })
  }

  if (
    !canWriteInventoryItem({
      role: currentUser.user.role,
      currentMinistryId,
      itemMinistryId: parsed.item.ministryId,
    })
  ) {
    return NextResponse.json(
      { message: "Solo puedes asignar inventario a tu ministerio" },
      { status: 403 }
    )
  }

  const relations = await validateInventoryRelations(db, parsed.item)

  if (!relations.ok) {
    return NextResponse.json({ message: relations.message }, { status: 400 })
  }

  await db.collection("inventory").updateOne(
    { _id: itemId },
    {
      $set: {
        ...parsed.item,
        updatedBy: currentUser.user._id.toString(),
        updatedAt: new Date(),
      },
    }
  )

  return NextResponse.json({ message: "Inventario actualizado" })
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: "Inventario no válido" },
      { status: 400 }
    )
  }

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

  const db = await getTenantDbByName(currentUser.tenantDbName)
  const itemId = new ObjectId(id)
  const existingItem = await db.collection("inventory").findOne({ _id: itemId })

  if (!existingItem) {
    return NextResponse.json(
      { message: "Inventario no encontrado" },
      { status: 404 }
    )
  }

  const currentMinistryId = getCurrentMinistryId(currentUser.user.ministryId)

  if (
    !canWriteInventoryItem({
      role: currentUser.user.role,
      currentMinistryId,
      itemMinistryId:
        typeof existingItem.ministryId === "string" && existingItem.ministryId
          ? existingItem.ministryId
          : null,
    })
  ) {
    return NextResponse.json(
      { message: "Solo puedes eliminar inventario de tu ministerio" },
      { status: 403 }
    )
  }

  await db.collection("inventory").deleteOne({ _id: itemId })

  return NextResponse.json({ message: "Inventario eliminado" })
}
