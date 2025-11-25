import { Prisma, PrismaClient } from '@prisma/client'

function normalizeDatabaseUrl(rawUrl?: string) {
  if (!rawUrl) {
    throw new Error('DATABASE_URL environment variable is not configured.')
  }
  
  // Trim whitespace
  rawUrl = rawUrl.trim()
  
  if (!rawUrl.startsWith('postgresql://') && !rawUrl.startsWith('postgres://')) {
    throw new Error('DATABASE_URL must start with postgresql:// or postgres://')
  }

  // Extract protocol
  const protocolMatch = rawUrl.match(/^(postgres(ql)?:\/\/)/)
  if (!protocolMatch) {
    throw new Error('Invalid database URL format')
  }
  
  const protocol = protocolMatch[0]
  const restOfUrl = rawUrl.slice(protocol.length)
  
  // Find the @ that separates credentials from host
  // Use lastIndexOf to handle passwords that might contain @
  const hostStartIndex = restOfUrl.lastIndexOf('@')
  
  let username: string | undefined
  let password: string | undefined
  let hostAndRest: string
  
  if (hostStartIndex === -1) {
    // No credentials, just host/database
    hostAndRest = restOfUrl
  } else {
    // Split credentials from host
    const credentials = restOfUrl.slice(0, hostStartIndex)
    hostAndRest = restOfUrl.slice(hostStartIndex + 1)
    
    // Split username and password (password might contain :, so only split at first :)
    const colonIndex = credentials.indexOf(':')
    
    if (colonIndex === -1) {
      // No password, just username
      username = credentials
    } else {
      username = credentials.slice(0, colonIndex)
      password = credentials.slice(colonIndex + 1)
    }
  }
  
  // Decode then re-encode to handle already-encoded passwords
  // This ensures consistent encoding without double-encoding
  let encodedUsername = username
  let encodedPassword = password
  
  if (username) {
    try {
      // Try decoding first (in case it's already encoded)
      const decoded = decodeURIComponent(username)
      encodedUsername = encodeURIComponent(decoded)
    } catch {
      // If decode fails, it's not encoded, so encode it
      encodedUsername = encodeURIComponent(username)
    }
  }
  
  if (password) {
    try {
      // Try decoding first (in case it's already encoded)
      const decoded = decodeURIComponent(password)
      encodedPassword = encodeURIComponent(decoded)
    } catch {
      // If decode fails, it's not encoded, so encode it
      encodedPassword = encodeURIComponent(password)
    }
  }
  
  // Reconstruct the URL
  let normalizedUrl = protocol
  
  if (encodedUsername) {
    normalizedUrl += encodedUsername
    if (encodedPassword) {
      normalizedUrl += `:${encodedPassword}`
    }
    normalizedUrl += '@'
  }
  
  normalizedUrl += hostAndRest
  
  // Add sslmode if not present
  if (!normalizedUrl.includes('sslmode=')) {
    const separator = normalizedUrl.includes('?') ? '&' : '?'
    normalizedUrl = `${normalizedUrl}${separator}sslmode=require`
  }
  
  // Validate the final URL by trying to parse it
  try {
    new URL(normalizedUrl)
  } catch (urlError) {
    throw new Error(`Failed to create valid database URL after normalization: ${urlError instanceof Error ? urlError.message : 'Unknown error'}`)
  }
  
  return normalizedUrl
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Normalize DATABASE_URL BEFORE any Prisma Client operations
// This ensures the environment variable is properly encoded before Prisma reads it
const rawDatabaseUrl = process.env.DATABASE_URL

let prisma: PrismaClient
let normalizedDatabaseUrl: string | undefined

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
  try {
    // Normalize the URL first - this handles special characters in passwords
    normalizedDatabaseUrl = normalizeDatabaseUrl(rawDatabaseUrl)
    
    // Update the environment variable so any other code that reads it gets the normalized version
    process.env.DATABASE_URL = normalizedDatabaseUrl

    const prismaClientOptions: Prisma.PrismaClientOptions = {
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasourceUrl: normalizedDatabaseUrl, // Explicitly pass normalized URL
    }

    // Create Prisma Client with normalized URL
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
  } catch (normalizeError: any) {
    console.error('[Prisma] Failed to normalize DATABASE_URL:', normalizeError?.message)
    console.error('[Prisma] Raw URL (masked):', rawDatabaseUrl ? `${rawDatabaseUrl.substring(0, 20)}...` : 'undefined')
    
    // Create a proxy that throws a helpful error
    prisma = new Proxy(
      {},
      {
        get() {
          throw new Error(
            `DATABASE_URL normalization failed: ${normalizeError?.message || 'Unknown error'}. ` +
            'Please check that your DATABASE_URL is properly formatted and that special characters in passwords are URL-encoded.'
          )
        },
      }
    ) as PrismaClient
  }
}

export { prisma }

