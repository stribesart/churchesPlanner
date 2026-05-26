import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"

import { getCurrentTenantUser, getTenantDbByName } from "@/lib/tenant"
import {
  canManageOfferings,
  enrichOfferings,
  parseOfferingInput,
  validateOfferingRelations,
} from "@/app/api/offerings/helpers"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: "Ofrenda no válida" },
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

  if (!canManageOfferings(currentUser.user.role)) {
    return NextResponse.json(
      { message: "No tienes acceso a las ofrendas" },
      { status: 403 }
    )
  }

  const db = await getTenantDbByName(currentUser.tenantDbName)
  const offering = await db.collection("offerings").findOne({
    _id: new ObjectId(id),
  })

  if (!offering) {
    return NextResponse.json(
      { message: "Ofrenda no encontrada" },
      { status: 404 }
    )
  }

  const [enrichedOffering] = await enrichOfferings(db, [offering])

  return NextResponse.json({ offering: enrichedOffering })
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: "Ofrenda no válida" },
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

  if (!canManageOfferings(currentUser.user.role)) {
    return NextResponse.json(
      { message: "No tienes permisos para modificar ofrendas" },
      { status: 403 }
    )
  }

  const body = await req.json()
  const parsed = parseOfferingInput(body)

  if (!parsed.ok) {
    return NextResponse.json({ message: parsed.message }, { status: 400 })
  }

  const db = await getTenantDbByName(currentUser.tenantDbName)
  const offeringId = new ObjectId(id)
  const existingOffering = await db.collection("offerings").findOne({
    _id: offeringId,
  })

  if (!existingOffering) {
    return NextResponse.json(
      { message: "Ofrenda no encontrada" },
      { status: 404 }
    )
  }

  const relations = await validateOfferingRelations(db, parsed.offering)

  if (!relations.ok) {
    return NextResponse.json({ message: relations.message }, { status: 400 })
  }

  await db.collection("offerings").updateOne(
    { _id: offeringId },
    {
      $set: {
        ...parsed.offering,
        updatedBy: currentUser.user._id.toString(),
        updatedAt: new Date(),
      },
    }
  )

  return NextResponse.json({ message: "Ofrenda actualizada" })
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: "Ofrenda no válida" },
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

  if (!canManageOfferings(currentUser.user.role)) {
    return NextResponse.json(
      { message: "No tienes permisos para eliminar ofrendas" },
      { status: 403 }
    )
  }

  const db = await getTenantDbByName(currentUser.tenantDbName)
  const result = await db.collection("offerings").deleteOne({
    _id: new ObjectId(id),
  })

  if (result.deletedCount === 0) {
    return NextResponse.json(
      { message: "Ofrenda no encontrada" },
      { status: 404 }
    )
  }

  return NextResponse.json({ message: "Ofrenda eliminada" })
}
