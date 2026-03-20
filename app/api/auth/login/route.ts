
import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {

  const { email, password } = await req.json()
  const client = await clientPromise
  const db = client.db("churchesPlanner")

  const user = await db.collection("users").findOne({ email })

  if (!user) {
    return NextResponse.json(
      { message: "Usuario no encontrado" },
      { status: 401 }
    )
  }

  const validPassword = await bcrypt.compare(password, user.password)

  if (!validPassword) {
    return NextResponse.json(
      { message: "Contraseña incorrecta" },
      { status: 401 }
    )
  }

  const response = NextResponse.json({ message: "Login correcto" })

  response.cookies.set("session", user._id.toString(), {
    httpOnly: true,
    path: "/",
  })

  return response
}