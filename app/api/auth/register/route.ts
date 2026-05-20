import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"
import { getGlobalEmailOwner, normalizeEmail } from "@/lib/tenant"

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

function getTodayInputDate() {
  return new Date().toISOString().split("T")[0]
}

export async function POST(req: Request) {
  const {
    churchName,
    registrantName,
    contactNumber,
    email,
    password,
    age,
    role,
    description,
  } = await req.json()
  const normalizedEmail = normalizeEmail(email || "")

  if (
    !churchName ||
    !registrantName ||
    !contactNumber ||
    !normalizedEmail ||
    !password ||
    !age ||
    !role ||
    !description
  ) {
    return NextResponse.json(
      { message: "Todos los campos son obligatorios" },
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

  const ageNumber = Number(age)
  if (!Number.isInteger(ageNumber) || ageNumber <= 0) {
    return NextResponse.json(
      { message: "Ingresa una edad válida" },
      { status: 400 }
    )
  }

  const client = await clientPromise
  const globalDb = client.db("churchesPlanner")

  const existingEmailOwner = await getGlobalEmailOwner(normalizedEmail)

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
  const adminName = registrantName.trim()

  const user = {
    name: adminName,
    realName: adminName,
    displayName: adminName.split(" ")[0] || adminName,
    age: ageNumber,
    email: normalizedEmail,
    password: passwordHash,
    role,
    createdAt: new Date(),
    isActive: true,
  }

  const userResult = await tenantDb.collection("users").insertOne(user)
  const organizer = userResult.insertedId.toString()

  const defaultEvent = {
    name: "Servicio dominical",
    description: `Primer servicio de ${churchName}`,
    date: getTodayInputDate(),
    startTime: "10:00",
    endTime: "12:00",
    location: "Iglesia principal",
    organizer,
    isActive: true,
    createdAt: new Date(),
  }

  const eventResult = await tenantDb.collection("events").insertOne(defaultEvent)

  const announcement = {
    title: `Primer servicio: ${defaultEvent.name}`,
    content: `La iglesia ${churchName} tiene su primer servicio el ${defaultEvent.date} a las ${defaultEvent.startTime}.`,
    author: organizer,
    eventId: eventResult.insertedId,
    isActive: true,
    createdAt: new Date(),
  }

  await tenantDb.collection("announcements").insertOne(announcement)

  await globalDb.collection("churches").insertOne({
    churchName,
    contactNumber,
    email: normalizedEmail,
    dbName,
    tenantKey,
    adminUserId: userResult.insertedId,
    createdAt: new Date(),
  })

  await globalDb.collection("userIndex").insertOne({
    email: normalizedEmail,
    dbName,
    tenantKey,
    churchName,
    userId: userResult.insertedId,
    role,
    createdAt: new Date(),
  })

  return NextResponse.json(
    {
      message: "Iglesia registrada correctamente",
      tenant: {
        dbName,
        churchName,
        email: normalizedEmail,
      },
    },
    { status: 201 }
  )
}
