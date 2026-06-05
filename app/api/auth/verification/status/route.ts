import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getCurrentTenantUser, getTenantDbByName } from "@/lib/tenant"

export async function GET(req: Request) {
  const currentUser = await getCurrentTenantUser(req)

  if (!currentUser) {
    return NextResponse.json({ message: "Acceso denegado" }, { status: 401 })
  }

  const db = await getTenantDbByName(currentUser.tenantDbName)
  const user = await db.collection("users").findOne(
    { _id: new ObjectId(currentUser.user._id) },
    {
      projection: {
        email: 1,
        phone: 1,
        emailVerified: 1,
        phoneVerified: 1,
      },
    }
  )

  if (!user) {
    return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 })
  }

  return NextResponse.json({
    email: user.email || "",
    phone: user.phone || "",
    emailVerified: Boolean(user.emailVerified),
    phoneVerified: Boolean(user.phoneVerified),
  })
}
