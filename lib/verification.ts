import { createHash, randomInt } from "crypto"

export const VERIFICATION_CODE_TTL_SECONDS = 10 * 60
export const VERIFICATION_MAX_ATTEMPTS = 5

export type VerificationChannel = "email"

export function isVerificationChannel(value: unknown): value is VerificationChannel {
  return value === "email"
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
  email,
}: {
  channel: VerificationChannel
  email?: string
  phone?: string
}) {
  return email || ""
}

export function getVerificationField() {
  return "emailVerified"
}

export function getVerificationSentMessage() {
  return "Código enviado al correo"
}
