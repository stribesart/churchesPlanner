import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"

import { getCurrentTenantUser, getTenantDbByName } from "@/lib/tenant"
import {
  enrichOfferings,
  parseOfferingInput,
  validateOfferingRelations,
} from "@/app/api/offerings/helpers"

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

function buildMockPaymentId() {
  return `mock_pi_${new ObjectId().toString()}`
}

export async function GET(req: Request) {
  const currentUser = await getCurrentTenantUser(req)

  if (!currentUser) {
    return NextResponse.json(
      { message: "Acceso denegado" },
      { status: 401 }
    )
  }

  const db = await getTenantDbByName(currentUser.tenantDbName)
  const userId = currentUser.user._id.toString()
  const offerings = await db
    .collection("offerings")
    .find({
      $or: [
        { userId },
        { recordedBy: userId, source: "self_service" },
      ],
    })
    .sort({ createdAt: -1 })
    .limit(10)
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

  const body = await req.json()
  const userId = currentUser.user._id.toString()
  const paymentMethod =
    typeof body.paymentMethod === "string" ? body.paymentMethod : "card"
  const parsed = parseOfferingInput({
    ...body,
    source: "self_service",
    userId,
    donorName: getUserDisplayName(currentUser.user),
    paymentMethod,
    paymentProvider: paymentMethod === "card" ? "mock" : "manual",
    providerPaymentId: paymentMethod === "card" ? buildMockPaymentId() : null,
    paymentStatus: "paid",
    entrySource: "self_service",
  })

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
    recordedBy: userId,
    createdAt: new Date(),
  })

  return NextResponse.json(
    {
      message: "Ofrenda registrada",
      offeringId: result.insertedId,
      providerPaymentId: parsed.offering.providerPaymentId,
      paymentStatus: parsed.offering.paymentStatus,
    },
    { status: 201 }
  )
}
