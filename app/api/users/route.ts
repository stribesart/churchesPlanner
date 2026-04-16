import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import bcrypt from "bcryptjs"

const dbName = "churchesPlanner"

export async function GET() {
  const client = await clientPromise
  const db = client.db(dbName)

  const users = await db.collection("users").find().toArray()

  console.log('usuarios encontrados', users)

  return NextResponse.json(users)
};

export async function POST(req: Request) {
  const { name, email, password, role } = await req.json()

  const client = await clientPromise
  const db = client.db(dbName)

  // verificar si ya existe
  const existingUser = await db.collection("users").findOne({ email })

  if (existingUser) {
    return NextResponse.json(
      { message: "El usuario ya existe" },
      { status: 400 }
    )
  }

  // encriptar contraseña
  const hashedPassword = await bcrypt.hash(password, 10)

  const newUser = {
    name,
    email,
    password: hashedPassword,
    role,
    createdAt: new Date(),
  }

  await db.collection("users").insertOne(newUser)

  return NextResponse.json({ message: "Usuario creado" })
}