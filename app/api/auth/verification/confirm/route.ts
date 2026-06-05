import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getCurrentTenantUser, getTenantDbByName } from "@/lib/tenant"
import {
  getVerificationField,
  hashVerificationCode,
  isVerificationChannel,
  VERIFICATION_MAX_ATTEMPTS,
} from "@/lib/verification"

export async function POST(req: Request) {
  const currentUser = await getCurrentTenantUser(req)

  if (!currentUser) {
    return NextResponse.json({ message: "Acceso denegado" }, { status: 401 })
  }

  const { channel, code } = await req.json()
  const trimmedCode = typeof code === "string" ? code.trim() : ""

  if (!isVerificationChannel(channel)) {
    return NextResponse.json(
      { message: "Selecciona correo, SMS o WhatsApp" },
      { status: 400 }
    )
  }

  if (!/^\d{6}$/.test(trimmedCode)) {
    return NextResponse.json(
      { message: "Ingresa el código de 6 dígitos" },
      { status: 400 }
    )
  }

  const db = await getTenantDbByName(currentUser.tenantDbName)
  const userId = new ObjectId(currentUser.user._id)
  const verification = await db.collection("verificationCodes").findOne({
    userId,
    channel,
    consumedAt: null,
    expiresAt: { $gt: new Date() },
  })

  if (!verification) {
    return NextResponse.json(
      { message: "Solicita un código nuevo" },
      { status: 400 }
    )
  }

  if ((verification.attempts || 0) >= VERIFICATION_MAX_ATTEMPTS) {
    return NextResponse.json(
      { message: "El código agotó sus intentos. Solicita uno nuevo" },
      { status: 429 }
    )
  }

  if (verification.codeHash !== hashVerificationCode(trimmedCode)) {
    await db.collection("verificationCodes").updateOne(
      { _id: verification._id },
      { $inc: { attempts: 1 }, $set: { lastAttemptAt: new Date() } }
    )

    return NextResponse.json(
      { message: "Código incorrecto" },
      { status: 400 }
    )
  }

  await db.collection("verificationCodes").updateOne(
    { _id: verification._id },
    { $set: { consumedAt: new Date(), verifiedAt: new Date() } }
  )

  await db.collection("users").updateOne(
    { _id: userId },
    {
      $set: {
        [getVerificationField(channel)]: true,
        updatedAt: new Date(),
      },
    }
  )

  return NextResponse.json({ message: "Contacto verificado" })
}
