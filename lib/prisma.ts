import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configuration optimized for serverless environments
const prismaClientOptions: {
  log?: Array<'query' | 'info' | 'warn' | 'error'>
} = {
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  // Disable prepared statements in serverless to avoid conflicts
  // This is handled at the connection string level with ?pgbouncer=true
  // or by using the connection pooler URL from Supabase
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(prismaClientOptions)

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
} else {
  // In production, ensure we reuse the same instance
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = prisma
  }
}

// Graceful shutdown
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

