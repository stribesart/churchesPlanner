import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(req: Request) {

  const cookie = req.headers.get("cookie")

  if (!cookie) {
    return NextResponse.json({ user: null })
  }

  const session = cookie
    .split("; ")
    .find(c => c.startsWith("session="))
    ?.split("=")[1]

  if (!session) {
    return NextResponse.json({ user: null })
  }

  const client = await clientPromise
  const db = client.db()

  const user = await db
    .collection("users")
    .findOne({ _id: new ObjectId(session) })

  return NextResponse.json({ user })
}