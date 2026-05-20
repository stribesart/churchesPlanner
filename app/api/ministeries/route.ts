import { NextResponse } from "next/server"
import { getTenantFromRequest, getTenantDbByName } from "@/lib/tenant"
import { ObjectId } from "mongodb"

export async function GET(req: Request) {
  const tenantDbName = await getTenantFromRequest(req)

  if (!tenantDbName) {
    return NextResponse.json(
      { message: "Acceso denegado" },
      { status: 401 }
    )
  }

  const db = await getTenantDbByName(tenantDbName)

  const ministeries = await db.collection("ministeries").find().toArray()

  // Obtener usuarios únicos que ya tienen un ministerio asignado
  const uniqueLeaderIds = Array.from(
    new Set(
      ministeries
        .map((ministry) => ministry.leader)
        .filter((id): id is string => typeof id === "string" && ObjectId.isValid(id))
    )
  )

  const leaderIds = uniqueLeaderIds.map((id) => new ObjectId(id))

  const leaders = leaderIds.length > 0 
    ? await db.collection("users").find({ _id: { $in: leaderIds } }).toArray()
    : []

  return NextResponse.json({ 
    ministeries, 
    leaders 
  })
}

export async function POST(req: Request) {
  const tenantDbName = await getTenantFromRequest(req)

  if (!tenantDbName) {
    return NextResponse.json(
      { message: "Acceso denegado" },
      { status: 401 }
    )
  }

  const { name, description, leader } = await req.json()

  const db = await getTenantDbByName(tenantDbName)

  // verificar si ya existe
  const existingMinistry = await db.collection("ministeries").findOne({ name })

  if (existingMinistry) {
    return NextResponse.json(
      { message: "El ministerio ya existe" },
      { status: 400 }
    )
  }

  const newMinistry = {
    name,
    description,
    leader,
    createdAt: new Date(),
  }

  await db.collection("ministeries").insertOne(newMinistry)

  return NextResponse.json({ message: "Ministerio creado" })
}
