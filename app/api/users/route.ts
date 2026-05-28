import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"
import {
  addUserToTenantIndex,
  getCurrentTenantUser,
  getGlobalEmailOwner,
  getTenantDbByName,
  normalizeEmail,
} from "@/lib/tenant"

function isLeaderRole(role: unknown) {
  if (typeof role !== "string") return false

  const normalizedRole = role.toLowerCase()

  return normalizedRole === "lider" || normalizedRole === "líder"
}

const allowedRoles = ["pastor", "lider", "miembro colaborador", "miembro"]

function isPasswordValid(password: string) {
  return /(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}/.test(password)
}

export async function GET(req: Request) {
  const currentUser = await getCurrentTenantUser(req)
  const tenantDbName = currentUser?.tenantDbName

  if (!tenantDbName) {
    return NextResponse.json(
      { message: "Acceso denegado" },
      { status: 401 }
    )
  }

  const db = await getTenantDbByName(tenantDbName)
  const user = currentUser.user
  const userIsLeader = isLeaderRole(user.role)
  const userMinistryId = typeof user.ministryId === "string" ? user.ministryId : null

  const usersFilter =
    userIsLeader
      ? {
          role: { $nin: ["pastor", "lider", "líder"] },
          ...(userMinistryId ? { ministryId: userMinistryId } : { _id: user._id }),
        }
      : {}

  const users = await db.collection("users").find(usersFilter).toArray()

  return NextResponse.json(users)
}

export async function POST(req: Request) {
  const currentUser = await getCurrentTenantUser(req)
  const tenantDbName = currentUser?.tenantDbName

  if (!tenantDbName) {
    return NextResponse.json(
      { message: "Acceso denegado" },
      { status: 401 }
    )
  }

  const { name, email, password, role, ministryId, ministryRoleId } = await req.json()
  const trimmedName = typeof name === "string" ? name.trim() : ""
  const normalizedEmail = normalizeEmail(email || "")
  const trimmedPassword = typeof password === "string" ? password.trim() : ""
  const currentUserIsLeader = isLeaderRole(currentUser.user.role)
  const currentMinistryId =
    typeof currentUser.user.ministryId === "string"
      ? currentUser.user.ministryId
      : null
  const db = await getTenantDbByName(tenantDbName)

  if (!trimmedName) {
    return NextResponse.json(
      { message: "El nombre es obligatorio" },
      { status: 400 }
    )
  }

  if (!normalizedEmail) {
    return NextResponse.json(
      { message: "El correo electrónico es obligatorio" },
      { status: 400 }
    )
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return NextResponse.json(
      { message: "Ingresa un correo electrónico válido" },
      { status: 400 }
    )
  }

  if (!trimmedPassword) {
    return NextResponse.json(
      { message: "La contraseña es obligatoria" },
      { status: 400 }
    )
  }

  if (!isPasswordValid(trimmedPassword)) {
    return NextResponse.json(
      {
        message:
          "La contraseña debe tener mínimo 8 caracteres, incluir una mayúscula, letras y un número",
      },
      { status: 400 }
    )
  }

  if (currentUserIsLeader && !currentMinistryId) {
    return NextResponse.json(
      { message: "El líder no tiene un ministerio asignado" },
      { status: 400 }
    )
  }

  if (currentUserIsLeader) {
    if (
      typeof ministryRoleId !== "string" ||
      !ministryRoleId.trim() ||
      !ObjectId.isValid(ministryRoleId)
    ) {
      return NextResponse.json(
        { message: "Selecciona un rol del ministerio" },
        { status: 400 }
      )
    }

    const ministryRole = await db.collection("ministryRoles").findOne({
      _id: new ObjectId(ministryRoleId),
      ministryId: currentMinistryId,
    })

    if (!ministryRole) {
      return NextResponse.json(
        { message: "El rol no pertenece a tu ministerio" },
        { status: 403 }
      )
    }
  }

  const normalizedRole =
    currentUserIsLeader ? "miembro colaborador" : role

  if (
    typeof normalizedRole !== "string" ||
    !allowedRoles.includes(normalizedRole)
  ) {
    return NextResponse.json(
      { message: "Selecciona un rol válido" },
      { status: 400 }
    )
  }

  const assignedMinistryId =
    currentUserIsLeader
      ? currentMinistryId
      : typeof ministryId === "string" && ministryId.trim()
        ? ministryId
        : null

  const existingEmailOwner = await getGlobalEmailOwner(normalizedEmail)

  if (existingEmailOwner) {
    return NextResponse.json(
      { message: "Ya existe una cuenta registrada con ese correo" },
      { status: 409 }
    )
  }

  const hashedPassword = await bcrypt.hash(trimmedPassword, 10)

  const newUser = {
    name: trimmedName,
    email: normalizedEmail,
    password: hashedPassword,
    role: normalizedRole,
    ministryId: assignedMinistryId,
    ministryRoleId:
      typeof ministryRoleId === "string" && ministryRoleId.trim()
        ? ministryRoleId
        : null,
    createdAt: new Date(),
  }

  const userResult = await db.collection("users").insertOne(newUser)
  await addUserToTenantIndex({
    email: normalizedEmail,
    dbName: tenantDbName,
    userId: userResult.insertedId,
    role: normalizedRole,
  })

  return NextResponse.json({ message: "Usuario creado" })
}
