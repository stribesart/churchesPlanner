
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getTenantByEmail, getTenantDbByName, normalizeEmail } from "@/lib/tenant"
import { buildSessionPayload, setAuthCookies } from "@/lib/session"

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

  const response = NextResponse.json({
    message: "Login correcto",
    needsVerification: !user.emailVerified && !user.phoneVerified,
  })
  const payload = buildSessionPayload({
    user,
    tenant: {
      dbName: tenant.dbName,
      churchName: typeof tenant.churchName === "string" ? tenant.churchName : undefined,
    },
  })

  setAuthCookies({ response, payload })

  return response
}
