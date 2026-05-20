import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import {
  addUserToTenantIndex,
  getGlobalEmailOwner,
  getTenantDbByName,
  getTenantFromRequest,
  normalizeEmail,
} from "@/lib/tenant"

export async function GET(req: Request) {
  const tenantDbName = await getTenantFromRequest(req)

  if (!tenantDbName) {
    return NextResponse.json(
      { message: "Acceso denegado" },
      { status: 401 }
    )
  }

  const db = await getTenantDbByName(tenantDbName)
  const users = await db.collection("users").find().toArray()

  return NextResponse.json(users)
}

export async function POST(req: Request) {
  const tenantDbName = await getTenantFromRequest(req)

  if (!tenantDbName) {
    return NextResponse.json(
      { message: "Acceso denegado" },
      { status: 401 }
    )
  }

  const { name, email, password, role } = await req.json()
  const normalizedEmail = normalizeEmail(email || "")
  const db = await getTenantDbByName(tenantDbName)

  const existingEmailOwner = await getGlobalEmailOwner(normalizedEmail)

  if (existingEmailOwner) {
    return NextResponse.json(
      { message: "Ya existe una cuenta registrada con ese correo" },
      { status: 409 }
    )
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const newUser = {
    name,
    email: normalizedEmail,
    password: hashedPassword,
    role,
    createdAt: new Date(),
  }

  const userResult = await db.collection("users").insertOne(newUser)
  await addUserToTenantIndex({
    email: normalizedEmail,
    dbName: tenantDbName,
    userId: userResult.insertedId,
    role,
  })

  return NextResponse.json({ message: "Usuario creado" })
}
