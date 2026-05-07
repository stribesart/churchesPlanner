import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

const dbName = "churchesPlanner"

export async function GET() {
  const client = await clientPromise
  const db = client.db(dbName)

  const announcements = await db.collection("announcements").find().toArray()

  return NextResponse.json(announcements)
}

export async function POST(req: Request) {
  const { title, content, author } = await req.json()

  const client = await clientPromise
  const db = client.db(dbName)

  const newAnnouncement = {
    title,
    content,
    author,
    createdAt: new Date(),
  }

  await db.collection("announcements").insertOne(newAnnouncement)

  return NextResponse.json({ message: "Anuncio creado" })
}