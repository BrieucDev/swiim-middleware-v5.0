import { Prisma, PrismaClient } from '@prisma/client'

function normalizeDatabaseUrl(rawUrl?: string) {
  if (!rawUrl) {
    throw new Error('DATABASE_URL environment variable is not configured.')
  }
  if (!rawUrl.startsWith('postgresql://') && !rawUrl.startsWith('postgres://')) {
    throw new Error('DATABASE_URL must start with postgresql:// or postgres://')
  }
  if (!rawUrl.includes('sslmode=')) {
    const separator = rawUrl.includes('?') ? '&' : '?'
    rawUrl = `${rawUrl}${separator}sslmode=require`
  }
  return rawUrl
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const rawDatabaseUrl = process.env.DATABASE_URL

let prisma: PrismaClient

if (!rawDatabaseUrl) {
  console.warn('[Prisma] DATABASE_URL is not configured. Prisma client is disabled.')
  prisma = new Proxy(
    {},
    {
      get() {
        throw new Error(
          'DATABASE_URL is not configured. Please set it in your environment to enable database features.'
        )
      },
    }
  ) as PrismaClient
} else {
  const DATABASE_URL = normalizeDatabaseUrl(rawDatabaseUrl)
  process.env.DATABASE_URL = DATABASE_URL

  const prismaClientOptions: Prisma.PrismaClientOptions = {
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasourceUrl: DATABASE_URL,
  }

  prisma = globalForPrisma.prisma ?? new PrismaClient(prismaClientOptions)

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
  } else if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = prisma
  }

  if (process.env.NODE_ENV === 'production') {
    process.on('beforeExit', async () => {
      await prisma.$disconnect()
    })
  }
}

export { prisma }

