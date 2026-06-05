import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { canSendRealEmail, sendVerificationEmail } from "@/lib/email"
import { getCurrentTenantUser, getTenantDbByName } from "@/lib/tenant"
import {
  generateVerificationCode,
  getVerificationDestination,
  getVerificationExpiration,
  getVerificationSentMessage,
  hashVerificationCode,
  isVerificationChannel,
} from "@/lib/verification"

export async function POST(req: Request) {
  const currentUser = await getCurrentTenantUser(req)

  if (!currentUser) {
    return NextResponse.json({ message: "Acceso denegado" }, { status: 401 })
  }

  const { channel } = await req.json()

  if (!isVerificationChannel(channel)) {
    return NextResponse.json(
      { message: "Selecciona correo, SMS o WhatsApp" },
      { status: 400 }
    )
  }

  const db = await getTenantDbByName(currentUser.tenantDbName)
  const userId = new ObjectId(currentUser.user._id)
  const user = await db.collection("users").findOne({ _id: userId })

  if (!user) {
    return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 })
  }

  const destination = getVerificationDestination({
    channel,
    email: user.email,
    phone: user.phone,
  })

  if (!destination) {
    return NextResponse.json(
      {
        message:
          channel === "email"
            ? "Este usuario no tiene correo registrado"
            : "Este usuario no tiene celular registrado",
      },
      { status: 400 }
    )
  }

  const code = generateVerificationCode()
  const expiresAt = getVerificationExpiration()
  const isProduction = process.env.NODE_ENV === "production"

  if (isProduction && channel === "email" && !canSendRealEmail()) {
    return NextResponse.json(
      { message: "El proveedor de correo no está configurado" },
      { status: 501 }
    )
  }

  if (isProduction && channel !== "email") {
    return NextResponse.json(
      { message: "El proveedor de SMS/WhatsApp no está configurado" },
      { status: 501 }
    )
  }

  await db.collection("verificationCodes").updateMany(
    {
      userId,
      channel,
      consumedAt: null,
    },
    { $set: { consumedAt: new Date(), replacedAt: new Date() } }
  )

  await db.collection("verificationCodes").insertOne({
    userId,
    channel,
    destination,
    codeHash: hashVerificationCode(code),
    attempts: 0,
    expiresAt,
    consumedAt: null,
    createdAt: new Date(),
  })

  if (channel === "email") {
    const emailResult = await sendVerificationEmail({
      to: destination,
      code,
      name: user.name,
    })

    if (!emailResult.ok && emailResult.mode === "email") {
      return NextResponse.json(
        { message: "No se pudo enviar el correo de verificación" },
        { status: 502 }
      )
    }
  }

  const isManualDelivery = !isProduction && (channel !== "email" || !canSendRealEmail())

  return NextResponse.json({
    message: getVerificationSentMessage(channel),
    expiresAt,
    deliveryMode: isManualDelivery ? "manual" : "email",
    devCode: isManualDelivery ? code : undefined,
  })
}
