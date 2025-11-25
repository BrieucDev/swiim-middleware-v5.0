import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Mark this route as dynamic to prevent static generation during build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
    try {
        // Simple query to check connection
        // We'll try to count stores as it's a core table
        const storeCount = await prisma.store.count()

        return NextResponse.json({
            ok: true,
            message: 'Database connection successful',
            storeCount
        }, { status: 200 })
    } catch (error: any) {
        console.error('Database health check failed:', error)
        
        // Provide more detailed error information
        const errorMessage = error?.message || String(error)
        const isConnectionError = errorMessage.includes('connection string') || 
                                  errorMessage.includes('invalid') ||
                                  errorMessage.includes('DATABASE_URL')
        
        return NextResponse.json({
            ok: false,
            message: 'Database connection failed',
            error: errorMessage,
            hint: isConnectionError 
                ? 'Please check your DATABASE_URL environment variable. Special characters in passwords must be URL-encoded.'
                : undefined
        }, { status: 500 })
    }
}
