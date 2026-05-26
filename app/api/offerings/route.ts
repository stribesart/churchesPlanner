import { NextResponse } from "next/server"

import { getCurrentTenantUser, getTenantDbByName } from "@/lib/tenant"
import {
  canManageOfferings,
  enrichOfferings,
  parseOfferingInput,
  validateOfferingRelations,
} from "@/app/api/offerings/helpers"

export async function GET(req: Request) {
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
  const offerings = await db
    .collection("offerings")
    .find()
    .sort({ createdAt: -1 })
    .toArray()
  const enrichedOfferings = await enrichOfferings(db, offerings)

  return NextResponse.json({ offerings: enrichedOfferings })
}

export async function POST(req: Request) {
  const currentUser = await getCurrentTenantUser(req)

  if (!currentUser) {
    return NextResponse.json(
      { message: "Acceso denegado" },
      { status: 401 }
    )
  }

  if (!canManageOfferings(currentUser.user.role)) {
    return NextResponse.json(
      { message: "No tienes permisos para registrar ofrendas" },
      { status: 403 }
    )
  }

  const body = await req.json()
  const parsed = parseOfferingInput(body)

  if (!parsed.ok) {
    return NextResponse.json({ message: parsed.message }, { status: 400 })
  }

  const db = await getTenantDbByName(currentUser.tenantDbName)
  const relations = await validateOfferingRelations(db, parsed.offering)

  if (!relations.ok) {
    return NextResponse.json({ message: relations.message }, { status: 400 })
  }

  const result = await db.collection("offerings").insertOne({
    ...parsed.offering,
    recordedBy: currentUser.user._id.toString(),
    createdAt: new Date(),
  })

  return NextResponse.json(
    {
      message: "Ofrenda registrada",
      offeringId: result.insertedId,
    },
    { status: 201 }
  )
}
