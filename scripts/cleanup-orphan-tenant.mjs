import "dotenv/config"
import { MongoClient } from "mongodb"

const dbName = process.argv[2]
const expectedEmail = process.argv[3]?.trim().toLowerCase()

if (!dbName) {
  console.error("Uso: npm run cleanup:tenant -- <dbName> [email]")
  process.exit(1)
}

const uri = process.env.MONGODB_URI || process.env.MONGO_URI

if (!uri) {
  console.error("Falta MONGODB_URI o MONGO_URI en el entorno")
  process.exit(1)
}

const protectedDbNames = new Set(["admin", "config", "local", "churchesPlanner"])

if (protectedDbNames.has(dbName)) {
  console.error(`No se puede limpiar la base protegida "${dbName}"`)
  process.exit(1)
}

const client = new MongoClient(uri)

try {
  await client.connect()

  const globalDb = client.db("churchesPlanner")
  const tenantDb = client.db(dbName)

  const church = await globalDb.collection("churches").findOne({ dbName })
  const userIndexFilter = expectedEmail ? { dbName, email: expectedEmail } : { dbName }
  const userIndexEntries = await globalDb
    .collection("userIndex")
    .find(userIndexFilter)
    .toArray()

  if (!church && userIndexEntries.length === 0) {
    console.log(`No hay registros globales para "${dbName}". Nada que limpiar.`)
    process.exit(0)
  }

  if (expectedEmail && userIndexEntries.length === 0) {
    console.error(
      `No se encontró userIndex para "${expectedEmail}" en "${dbName}". No se borró nada.`
    )
    process.exit(1)
  }

  const [usersCount, eventsCount, announcementsCount] = await Promise.all([
    tenantDb.collection("users").countDocuments(),
    tenantDb.collection("events").countDocuments(),
    tenantDb.collection("announcements").countDocuments(),
  ])

  const tenantIsEmpty =
    usersCount === 0 && eventsCount === 0 && announcementsCount === 0

  if (!tenantIsEmpty) {
    console.error(
      [
        `El tenant "${dbName}" no está vacío. No se borró nada.`,
        `users: ${usersCount}`,
        `events: ${eventsCount}`,
        `announcements: ${announcementsCount}`,
      ].join("\n")
    )
    process.exit(1)
  }

  const userIndexDeleteFilter = expectedEmail ? { dbName, email: expectedEmail } : { dbName }
  const userIndexResult = await globalDb
    .collection("userIndex")
    .deleteMany(userIndexDeleteFilter)
  const churchResult = await globalDb.collection("churches").deleteOne({ dbName })
  const dropResult = await tenantDb.dropDatabase()

  console.log(
    JSON.stringify(
      {
        cleaned: true,
        dbName,
        email: expectedEmail || null,
        deletedUserIndex: userIndexResult.deletedCount,
        deletedChurches: churchResult.deletedCount,
        droppedTenantDb: dropResult,
      },
      null,
      2
    )
  )
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
} finally {
  await client.close()
}
