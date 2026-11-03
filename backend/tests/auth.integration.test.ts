import "dotenv/config"
import assert from "node:assert/strict"
import { spawn, type ChildProcess } from "node:child_process"
import { once } from "node:events"
import { test } from "node:test"
import bcrypt from "bcryptjs"
import { prisma } from "../src/config/db.js"

const port = Number(process.env.AUTH_TEST_PORT || 3105)
const baseUrl = `http://127.0.0.1:${port}/api`
const frontendOrigin = "http://localhost:8443"
const password = "AuthTest_123"
const email = `auth.test.${Date.now()}.${Math.random().toString(16).slice(2)}@example.test`
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL)
let server: ChildProcess | undefined

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function fetchWithTimeout(url: string, init: RequestInit = {}, timeout = 1000) {
  return fetch(url, { ...init, signal: AbortSignal.timeout(timeout) })
}

async function waitForHealth() {
  let lastError: unknown
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetchWithTimeout(`${baseUrl}/health`)
      if (response.ok) return
    } catch (error) {
      lastError = error
    }
    await wait(100)
  }
  throw lastError || new Error("Backend did not become ready")
}

async function apiRequest(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  headers.set("Origin", frontendOrigin)
  if (!["GET", "HEAD", "OPTIONS"].includes((init.method || "GET").toUpperCase())) {
    headers.set("X-CinemaHub-Request", "1")
    headers.set("Content-Type", "application/json")
  }
  const response = await fetchWithTimeout(`${baseUrl}${path}`, { ...init, headers })
  return { response, body: await response.json() }
}

function sessionCookie(response: Response) {
  const cookies = response.headers.getSetCookie?.() || []
  const cookie = cookies[0] || response.headers.get("set-cookie")
  assert.ok(cookie, "Response must set a session cookie")
  assert.match(cookie, /session_token=[a-f0-9]{64}/i)
  assert.match(cookie, /HttpOnly/i)
  return cookie.split(";", 1)[0]
}

test("AUTH-INT: register, login and logout work against MySQL", { skip: !hasDatabaseUrl && "DATABASE_URL is not configured" }, async (t) => {
  server = spawn(process.execPath, ["--import", "tsx", "src/index.ts"], {
    cwd: new URL("..", import.meta.url),
    env: {
      ...process.env,
      PORT: String(port),
      CLIENT_URL: frontendOrigin,
      NODE_ENV: "test",
    },
    stdio: "pipe",
  })

  try {
    await waitForHealth()

    await t.test("AUTH-01 registers a customer and hashes the password", async () => {
      const { response, body } = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, fullName: "Auth Test User", phone: "0900000000" }),
      })

      assert.equal(response.status, 201)
      assert.equal(body.user.email, email)
      assert.equal(body.user.role, "customer")
      assert.equal(body.user.passwordHash, undefined)
      sessionCookie(response)

      const savedUser = await prisma.user.findUnique({ where: { email } })
      assert.ok(savedUser)
      assert.notEqual(savedUser.passwordHash, password)
      assert.equal(await bcrypt.compare(password, savedUser.passwordHash), true)
    })

    await t.test("AUTH-02 rejects duplicate email and invalid registration data", async () => {
      const duplicate = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, fullName: "Another User" }),
      })
      assert.equal(duplicate.response.status, 400)
      assert.match(duplicate.body.error, /đã được đăng ký/i)

      const invalid = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email: "not-an-email", password: "123", fullName: "A" }),
      })
      assert.equal(invalid.response.status, 400)
    })

    await t.test("AUTH-03 logs in with valid credentials and creates a new session", async () => {
      const { response, body } = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })
      assert.equal(response.status, 200)
      assert.equal(body.user.email, email)
      const cookie = sessionCookie(response)

      const me = await apiRequest("/auth/me", { headers: { Cookie: cookie } })
      assert.equal(me.response.status, 200)
      assert.equal(me.body.user.email, email)
    })

    await t.test("AUTH-04 rejects an incorrect password", async () => {
      const result = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password: "wrong-password" }),
      })
      assert.equal(result.response.status, 401)
      assert.match(result.body.error, /không chính xác/i)
    })

    await t.test("AUTH-05 logout invalidates the session", async () => {
      const login = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })
      const cookie = sessionCookie(login.response)

      const logout = await apiRequest("/auth/logout", { method: "POST", headers: { Cookie: cookie } })
      assert.equal(logout.response.status, 200)

      const me = await apiRequest("/auth/me", { headers: { Cookie: cookie } })
      assert.equal(me.response.status, 401)
    })
  } finally {
    await prisma.user.delete({ where: { email } }).catch(() => {})
    await prisma.$disconnect()
    if (server && !server.killed) {
      const exited = once(server, "exit")
      server.kill()
      await Promise.race([exited, wait(3000)])
    }
  }
})
