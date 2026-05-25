const baseUrl = process.env.LOAD_TEST_URL || "http://localhost:3000"
const concurrency = Number(process.env.CONCURRENCY || 25)
const durationSeconds = Number(process.env.DURATION_SECONDS || 30)
const email = process.env.LOAD_TEST_EMAIL
const password = process.env.LOAD_TEST_PASSWORD

const publicPaths = ["/", "/login"]
const results = []
let stopAt = Date.now() + durationSeconds * 1000

function percentile(values, p) {
  if (values.length === 0) return 0

  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.ceil((p / 100) * sorted.length) - 1

  return sorted[Math.max(0, index)]
}

async function request(path, options = {}) {
  const start = performance.now()
  let status = 0
  let ok = false
  let error = null

  try {
    const res = await fetch(`${baseUrl}${path}`, options)
    status = res.status
    ok = res.ok
    await res.arrayBuffer()
  } catch (requestError) {
    error = requestError.message
  }

  results.push({
    path,
    status,
    ok,
    error,
    duration: performance.now() - start,
  })
}

async function publicUser() {
  while (Date.now() < stopAt) {
    const path = publicPaths[Math.floor(Math.random() * publicPaths.length)]
    await request(path)
  }
}

async function loginUser() {
  while (Date.now() < stopAt) {
    await request("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })
  }
}

async function main() {
  const scenario = email && password ? loginUser : publicUser
  const users = Array.from({ length: concurrency }, () => scenario())

  console.log(`Load test: ${baseUrl}`)
  console.log(`Concurrency: ${concurrency}`)
  console.log(`Duration: ${durationSeconds}s`)
  console.log(`Scenario: ${email && password ? "login" : "public pages"}`)

  await Promise.all(users)

  const durations = results.map((result) => result.duration)
  const failed = results.filter((result) => !result.ok)
  const byStatus = results.reduce((acc, result) => {
    const key = result.status || "network_error"
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  console.log("")
  console.log("Results")
  console.log(`Requests: ${results.length}`)
  console.log(`Failures: ${failed.length}`)
  console.log(`Avg: ${Math.round(durations.reduce((a, b) => a + b, 0) / durations.length || 0)}ms`)
  console.log(`p50: ${Math.round(percentile(durations, 50))}ms`)
  console.log(`p95: ${Math.round(percentile(durations, 95))}ms`)
  console.log(`p99: ${Math.round(percentile(durations, 99))}ms`)
  console.log(`Status: ${JSON.stringify(byStatus)}`)

  if (failed.length > 0) {
    console.log("")
    console.log("Sample failures")
    console.log(failed.slice(0, 5))
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
