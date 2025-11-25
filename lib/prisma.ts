import { Prisma, PrismaClient } from '@prisma/client'

function normalizeDatabaseUrl(rawUrl?: string) {
  if (!rawUrl) {
    throw new Error('DATABASE_URL environment variable is not configured.')
  }
  
  // Trim whitespace and remove any surrounding quotes
  rawUrl = rawUrl.trim().replace(/^["']|["']$/g, '')
  
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
  
  // hostAndRest should already be properly formatted (host:port/database?params)
  // Just append it as-is
  normalizedUrl += hostAndRest
  
  // Add sslmode if not present
  if (!normalizedUrl.includes('sslmode=')) {
    const separator = normalizedUrl.includes('?') ? '&' : '?'
    normalizedUrl = `${normalizedUrl}${separator}sslmode=require`
  }
  
  // Don't validate with URL constructor - PostgreSQL URLs may have formats
  // that the standard URL constructor doesn't accept
  // Prisma will validate it when it tries to connect
  
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
    const errorMessage = normalizeError?.message || 'Unknown error'
    console.error('[Prisma] Failed to normalize DATABASE_URL:', errorMessage)
    
    // Log a masked version of the URL for debugging (first 30 chars)
    if (rawDatabaseUrl) {
      const masked = rawDatabaseUrl.length > 30 
        ? `${rawDatabaseUrl.substring(0, 30)}...` 
        : rawDatabaseUrl
      console.error('[Prisma] Raw URL (masked):', masked)
    }
    
    // Try to create Prisma Client with raw URL anyway - maybe it will work
    // Prisma's own validation might be more lenient
    try {
      console.warn('[Prisma] Attempting to use raw DATABASE_URL despite normalization failure')
      prisma = globalForPrisma.prisma ?? new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        datasourceUrl: rawDatabaseUrl,
      })
      
      if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.prisma = prisma
      } else if (!globalForPrisma.prisma) {
        globalForPrisma.prisma = prisma
      }
    } catch (prismaError: any) {
      // If Prisma also fails, create a proxy with helpful error message
      console.error('[Prisma] Failed to create Prisma Client with raw URL:', prismaError?.message)
      prisma = new Proxy(
        {},
        {
          get() {
            throw new Error(
              `DATABASE_URL normalization failed: ${errorMessage}. ` +
              `Prisma Client creation also failed: ${prismaError?.message || 'Unknown error'}. ` +
              'Please check that your DATABASE_URL is properly formatted. ' +
              'Special characters in passwords should be URL-encoded (e.g., @ becomes %40, : becomes %3A).'
            )
          },
        }
      ) as PrismaClient
    }
  }
}

// Function to create a fresh Prisma Client instance
// This is useful in serverless environments where prepared statements can conflict
export function getFreshPrismaClient(): PrismaClient {
  if (!normalizedDatabaseUrl) {
    const rawUrl = process.env.DATABASE_URL
    if (!rawUrl) {
      throw new Error('DATABASE_URL is not configured.')
    }
    try {
      const normalized = normalizeDatabaseUrl(rawUrl)
      return new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        datasourceUrl: normalized,
      })
    } catch (error) {
      throw new Error(`Failed to create Prisma Client: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasourceUrl: normalizedDatabaseUrl,
  })
}

// Helper function to retry queries with fresh client instances
// This handles prepared statement conflicts in serverless environments
export async function retryWithFreshClient<T>(
  queryFn: (client: PrismaClient) => Promise<T>,
  maxRetries: number = 3,
  delay: number = 200
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const client = getFreshPrismaClient()
    try {
      const result = await queryFn(client)
      await client.$disconnect().catch(() => {})
      return result
    } catch (error: any) {
      await client.$disconnect().catch(() => {})
      const errorMessage = error?.message || String(error)
      const isPreparedStatementError =
        errorMessage.includes('prepared statement') &&
        (errorMessage.includes('already exists') || /s\d+/.test(errorMessage))

      if (isPreparedStatementError && attempt < maxRetries - 1) {
        console.log(
          `[Prisma Retry] Prepared statement error, attempt ${attempt + 1}/${maxRetries}, waiting ${delay * (attempt + 1)}ms...`
        )
        await new Promise((resolve) => setTimeout(resolve, delay * (attempt + 1)))
        continue
      }
      throw error
    }
  }
  throw new Error('Max retries exceeded')
}

export { prisma }

