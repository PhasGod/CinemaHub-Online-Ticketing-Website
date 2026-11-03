import assert from "node:assert/strict"
import { test } from "node:test"
import bcrypt from "bcryptjs"
import { prisma } from "../src/config/db.js"
import { login, register } from "../src/controllers/auth.controller.js"

type StoredUser = {
  id: string
  email: string
  passwordHash: string
  fullName: string
  phone: string | null
  role: "customer" | "staff" | "admin"
  isActive: boolean
}

function createResponseRecorder() {
  const result: { statusCode: number; body?: any; cookies: Array<{ name: string; value: string; options: any }> } = {
    statusCode: 200,
    cookies: [],
  }
  const response: any = {
    status(code: number) {
      result.statusCode = code
      return response
    },
    json(body: any) {
      result.body = body
      return response
    },
    cookie(name: string, value: string, options: any) {
      result.cookies.push({ name, value, options })
      return response
    },
  }
  return { response, result }
}

function installPrismaMock() {
  const users = new Map<string, StoredUser>()
  const sessions: Array<{ userId: string; token: string; expiresAt: Date }> = []
  const originalUser = Object.getOwnPropertyDescriptor(prisma, "user")
  const originalSession = Object.getOwnPropertyDescriptor(prisma, "session")

  Object.defineProperty(prisma, "user", {
    configurable: true,
    value: {
      findUnique: async ({ where }: { where: { email?: string } }) => (where.email ? users.get(where.email) || null : null),
      create: async ({ data }: { data: Omit<StoredUser, "id"> }) => {
        const user = { id: `user-${users.size + 1}`, ...data }
        users.set(user.email, user)
        return user
      },
    },
  })
  Object.defineProperty(prisma, "session", {
    configurable: true,
    value: {
      create: async ({ data }: { data: { userId: string; token: string; expiresAt: Date } }) => {
        sessions.push(data)
        return { id: `session-${sessions.length}`, ...data }
      },
    },
  })

  return {
    users,
    sessions,
    restore() {
      if (originalUser) Object.defineProperty(prisma, "user", originalUser)
      else delete (prisma as any).user
      if (originalSession) Object.defineProperty(prisma, "session", originalSession)
      else delete (prisma as any).session
    },
  }
}

test("AUTH-UNIT: registration validates input, creates a customer, and hashes password", async () => {
  const mock = installPrismaMock()
  try {
    const valid = createResponseRecorder()
    await register(
      { body: { email: "Customer@Example.test", password: "Secret_123", fullName: "Customer Test", phone: "0900000000" } } as any,
      valid.response
    )

    assert.equal(valid.result.statusCode, 201)
    assert.equal(valid.result.body.user.email, "customer@example.test")
    assert.equal(valid.result.body.user.role, "customer")
    assert.equal(valid.result.body.user.passwordHash, undefined)
    assert.equal(valid.result.cookies[0]?.name, "session_token")
    assert.equal(valid.result.cookies[0]?.options.httpOnly, true)

    const stored = mock.users.get("customer@example.test")
    assert.ok(stored)
    assert.notEqual(stored.passwordHash, "Secret_123")
    assert.equal(await bcrypt.compare("Secret_123", stored.passwordHash), true)
    assert.equal(mock.sessions.length, 1)

    const duplicate = createResponseRecorder()
    await register(
      { body: { email: "customer@example.test", password: "Secret_123", fullName: "Duplicate" } } as any,
      duplicate.response
    )
    assert.equal(duplicate.result.statusCode, 400)
    assert.match(duplicate.result.body.error, /đã được đăng ký/i)

    const invalid = createResponseRecorder()
    await register({ body: { email: "invalid", password: "123", fullName: "A" } } as any, invalid.response)
    assert.equal(invalid.result.statusCode, 400)
  } finally {
    mock.restore()
  }
})

test("AUTH-UNIT: login accepts valid credentials and rejects invalid credentials", async () => {
  const mock = installPrismaMock()
  try {
    mock.users.set("customer@example.test", {
      id: "user-1",
      email: "customer@example.test",
      passwordHash: await bcrypt.hash("Secret_123", 10),
      fullName: "Customer Test",
      phone: null,
      role: "customer",
      isActive: true,
    })

    const valid = createResponseRecorder()
    await login({ body: { email: "CUSTOMER@example.test", password: "Secret_123" } } as any, valid.response)
    assert.equal(valid.result.statusCode, 200)
    assert.equal(valid.result.body.user.email, "customer@example.test")
    assert.equal(valid.result.cookies[0]?.name, "session_token")
    assert.equal(mock.sessions.length, 1)

    const invalidPassword = createResponseRecorder()
    await login({ body: { email: "customer@example.test", password: "not-the-password" } } as any, invalidPassword.response)
    assert.equal(invalidPassword.result.statusCode, 401)
    assert.match(invalidPassword.result.body.error, /không chính xác/i)

    const unknownEmail = createResponseRecorder()
    await login({ body: { email: "unknown@example.test", password: "Secret_123" } } as any, unknownEmail.response)
    assert.equal(unknownEmail.result.statusCode, 401)
  } finally {
    mock.restore()
  }
})
