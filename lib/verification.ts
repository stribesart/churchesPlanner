import { createHash, randomInt } from "crypto"

export const VERIFICATION_CODE_TTL_SECONDS = 10 * 60
export const VERIFICATION_MAX_ATTEMPTS = 5

export type VerificationChannel = "email" | "sms" | "whatsapp"

export function isVerificationChannel(value: unknown): value is VerificationChannel {
  return value === "email" || value === "sms" || value === "whatsapp"
}

export function normalizePhone(value: unknown) {
  if (typeof value !== "string") return ""

  const trimmed = value.trim()
  const hasPlus = trimmed.startsWith("+")
  const digits = trimmed.replace(/\D/g, "")

  if (!digits) return ""

  return hasPlus ? `+${digits}` : digits
}

export function isValidPhone(value: string) {
  return /^\+?\d{10,15}$/.test(value)
}

export function generateVerificationCode() {
  return randomInt(100000, 1000000).toString()
}

export function hashVerificationCode(code: string) {
  const secret =
    process.env.SESSION_SECRET ||
    process.env.JWT_SECRET ||
    process.env.MONGODB_URI ||
    "churches-planner-local-verification-secret"

  return createHash("sha256").update(`${code}:${secret}`).digest("hex")
}

export function getVerificationExpiration() {
  return new Date(Date.now() + VERIFICATION_CODE_TTL_SECONDS * 1000)
}

export function getVerificationDestination({
  channel,
  email,
  phone,
}: {
  channel: VerificationChannel
  email?: string
  phone?: string
}) {
  return channel === "email" ? email || "" : phone || ""
}

export function getVerificationField(channel: VerificationChannel) {
  return channel === "email" ? "emailVerified" : "phoneVerified"
}

export function getVerificationSentMessage(channel: VerificationChannel) {
  if (channel === "email") return "Código enviado al correo"
  if (channel === "sms") return "Código enviado por SMS"

  return "Código enviado por WhatsApp"
}
