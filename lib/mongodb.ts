import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI as string

if (!uri) {
  throw new Error("Please define MONGODB_URI")
}

// let client: MongoClient
// let clientPromise: Promise<MongoClient>

const client: MongoClient = new MongoClient(uri)
const clientPromise: Promise<MongoClient> = client.connect()

export default clientPromise