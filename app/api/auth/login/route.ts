
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getTenantByEmail, getTenantDbByName, normalizeEmail } from "@/lib/tenant"

export async function POST(req: Request) {
  const { email, password } = await req.json()
  const normalizedEmail = normalizeEmail(email || "")
  const tenant = await getTenantByEmail(normalizedEmail)

  if (!tenant || !tenant.dbName) {
    return NextResponse.json(
      { message: "Iglesia o usuario no encontrado" },
      { status: 401 }
    )
  }

  const tenantDb = await getTenantDbByName(tenant.dbName)
  const user = await tenantDb.collection("users").findOne(
    { email: normalizedEmail },
    { collation: { locale: "en", strength: 2 } }
  )

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

  response.cookies.set("tenant", tenant.dbName, {
    httpOnly: true,
    path: "/",
  })

  return response
}
