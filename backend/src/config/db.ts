import { PrismaClient } from "@prisma/client"

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
})

export const TRANSACTION_OPTIONS = {
  maxWait: 10000, // 10 giây: thời gian tối đa chờ connection từ pool
  timeout: 20000, // 20 giây: thời gian tối đa để transaction hoàn thành trước khi tự rollback
} as const

