import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

const dbName = "churchesPlanner"

export async function GET() {
  const client = await clientPromise
  const db = client.db(dbName)

  const ministeries = await db.collection("ministeries").find().toArray()

  // Obtener usuarios únicos que ya tienen un ministerio asignado
  const leaderIds = ministeries
    .map(m => m.leader)
    .filter(Boolean)
    .filter((id, index, self) => self.indexOf(id) === index)
    .map(id => {
      try {
        return new ObjectId(id)
      } catch {
        return null
      }
    })
    .filter(Boolean)

  const leaders = leaderIds.length > 0 
    ? await db.collection("users").find({ _id: { $in: leaderIds } }).toArray()
    : []

  return NextResponse.json({ 
    ministeries, 
    leaders 
  })
}

export async function POST(req: Request) {
  const { name, description, leader } = await req.json()

  const client = await clientPromise
  const db = client.db(dbName)

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