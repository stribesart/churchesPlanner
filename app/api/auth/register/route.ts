import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"
import { getGlobalEmailOwner, normalizeEmail } from "@/lib/tenant"
import { isValidPhone, normalizePhone } from "@/lib/verification"

function normalizeDbName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40)
}

function generateTenantKey() {
  return randomBytes(3).toString("hex")
}

const serviceDayIndexes: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
}
const validServiceFrequencies = new Set(["weekly", "biweekly", "monthly"])

function normalizeText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

function getNextServiceDate(serviceDay: string) {
  const normalizedServiceDay = normalizeText(serviceDay)
  const targetDay = serviceDayIndexes[normalizedServiceDay]

  if (targetDay === undefined) {
    return null
  }

  const date = new Date()
  const daysUntilService = (targetDay - date.getDay() + 7) % 7

  date.setDate(date.getDate() + daysUntilService)

  return date.toISOString().split("T")[0]
}

function isValidTime(value: unknown) {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

function addHoursToTime(time: string, hoursToAdd: number) {
  const [hours, minutes] = time.split(":").map(Number)
  const nextHours = (hours + hoursToAdd) % 24

  return `${nextHours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`
}

export async function POST(req: Request) {
  const {
    churchName,
    location,
    generalServiceDay,
    generalServiceStartTime,
    serviceFrequency,
    adminName,
    adminEmail,
    adminPhone,
    password,
    age,
  } = await req.json()
  const normalizedAdminEmail = normalizeEmail(adminEmail || "")
  const normalizedAdminPhone = normalizePhone(adminPhone)

  if (
    !churchName ||
    !generalServiceDay ||
    !generalServiceStartTime ||
    !adminName ||
    !normalizedAdminEmail ||
    !normalizedAdminPhone ||
    !password ||
    !age
  ) {
    return NextResponse.json(
      { message: "Todos los campos son obligatorios" },
      { status: 400 }
    )
  }

  if (!isValidPhone(normalizedAdminPhone)) {
    return NextResponse.json(
      { message: "Ingresa un celular válido con 10 a 15 dígitos" },
      { status: 400 }
    )
  }

  if (!isValidTime(generalServiceStartTime)) {
    return NextResponse.json(
      { message: "Selecciona una hora de servicio válida" },
      { status: 400 }
    )
  }

  const normalizedServiceFrequency =
    typeof serviceFrequency === "string" && serviceFrequency.trim()
      ? serviceFrequency
      : "weekly"

  if (!validServiceFrequencies.has(normalizedServiceFrequency)) {
    return NextResponse.json(
      { message: "Selecciona una frecuencia de servicio válida" },
      { status: 400 }
    )
  }

  if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}/.test(password)) {
    return NextResponse.json(
      {
        message:
          "La contraseña debe tener mínimo 8 caracteres, incluir una mayúscula, letras y un número",
      },
      { status: 400 }
    )
  }

  const firstServiceDate = getNextServiceDate(generalServiceDay)

  if (!firstServiceDate) {
    return NextResponse.json(
      { message: "Selecciona un día de servicio válido" },
      { status: 400 }
    )
  }

  const ageNumber = Number(age)
  if (!Number.isInteger(ageNumber) || ageNumber <= 0) {
    return NextResponse.json(
      { message: "Ingresa una edad válida" },
      { status: 400 }
    )
  }

  const client = await clientPromise
  const globalDb = client.db("churchesPlanner")

  const existingEmailOwner = await getGlobalEmailOwner(normalizedAdminEmail)

  if (existingEmailOwner) {
    return NextResponse.json(
      { message: "Ya existe una cuenta registrada con ese correo" },
      { status: 409 }
    )
  }

  const existingTenant = await globalDb.collection("churches").findOne({
    churchName,
  })

  if (existingTenant) {
    return NextResponse.json(
      { message: "Ya existe una iglesia con ese nombre" },
      { status: 409 }
    )
  }

  const tenantKey = generateTenantKey()
  const dbName = `${normalizeDbName(churchName)}_db_${tenantKey}`
  const tenantDb = client.db(dbName)
  const passwordHash = await bcrypt.hash(password, 10)
  const trimmedAdminName = adminName.trim()
  const adminRole = "Administrador"

  const user = {
    name: trimmedAdminName,
    realName: trimmedAdminName,
    displayName: trimmedAdminName.split(" ")[0] || trimmedAdminName,
    age: ageNumber,
    email: normalizedAdminEmail,
    phone: normalizedAdminPhone,
    emailVerified: false,
    phoneVerified: false,
    password: passwordHash,
    role: adminRole,
    isSuperUser: true,
    ministryId: null,
    createdAt: new Date(),
    isActive: true,
  }

  const userResult = await tenantDb.collection("users").insertOne(user)
  const organizer = userResult.insertedId.toString()

  const defaultEvent = {
    name: "Servicio general",
    description: `Primer servicio de ${churchName}`,
    date: firstServiceDate,
    startTime: generalServiceStartTime,
    endTime: addHoursToTime(generalServiceStartTime, 2),
    location: typeof location === "string" && location.trim() ? location.trim() : "Iglesia principal",
    organizer,
    isActive: true,
    createdAt: new Date(),
  }

  const eventResult = await tenantDb.collection("events").insertOne(defaultEvent)

  const announcement = {
    title: `Primer servicio: ${defaultEvent.name}`,
    content: `La iglesia ${churchName} tiene su primer servicio general el ${defaultEvent.date} a las ${defaultEvent.startTime}.`,
    author: organizer,
    eventId: eventResult.insertedId,
    isActive: true,
    createdAt: new Date(),
  }

  await tenantDb.collection("announcements").insertOne(announcement)

  await globalDb.collection("churches").insertOne({
    churchName,
    location: typeof location === "string" ? location.trim() : "",
    generalServiceDay,
    generalServiceStartTime,
    serviceFrequency: normalizedServiceFrequency,
    dbName,
    tenantKey,
    ownerUserId: userResult.insertedId,
    superUserId: userResult.insertedId,
    adminUserId: userResult.insertedId,
    createdAt: new Date(),
  })

  await globalDb.collection("userIndex").insertOne({
    email: normalizedAdminEmail,
    dbName,
    tenantKey,
    churchName,
    userId: userResult.insertedId,
    role: adminRole,
    isSuperUser: true,
    createdAt: new Date(),
  })

  return NextResponse.json(
    {
      message: "Iglesia registrada correctamente",
      tenant: {
        dbName,
        churchName,
        adminEmail: normalizedAdminEmail,
      },
    },
    { status: 201 }
  )
}
