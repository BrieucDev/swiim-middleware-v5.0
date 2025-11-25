import { retryWithFreshClient } from '@/lib/prisma'
import type { PrismaClient } from '@prisma/client'

type TrendPoint = {
  date: string
  tickets: number
  revenue: number
}

type StorePerformance = {
  id: string
  name: string
  tickets: number
  revenue: number
  averageBasket: number
  identificationRate: number
}

type CategoryPerformance = {
  name: string
  revenue: number
  tickets: number
  averageBasket: number
}

type IdentificationOverview = {
  identifiedRevenueShare: number
  identifiedAverageBasket: number
  unidentifiedAverageBasket: number
  identifiedFrequency: number
}

type EnvironmentImpact = {
  digitalTicketsYear: number
  paperSavedKg: number
  co2SavedKg: number
  treesEquivalent: number
}

export type AnalyticsOverview = {
  hasData: boolean
  overview: {
    totalReceipts: number
    totalRevenue: number
    averageBasket: number
    activeCustomers: number
    identificationRate: number
    digitalRate: number
    trends?: {
      receiptsTrend: number
      revenueTrend: number
      identificationTrend: number
    }
  }
  trends: TrendPoint[]
  stores: StorePerformance[]
  categories: CategoryPerformance[]
  identification: IdentificationOverview
  environment: EnvironmentImpact
}

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  try {
    console.log('[Analytics] Starting data fetch...')
    
    const now = new Date()
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - 30)

    const previousStart = new Date(startDate)
    previousStart.setDate(previousStart.getDate() - 30)

    const yearStart = new Date(now)
    yearStart.setFullYear(yearStart.getFullYear() - 1)

    console.log('[Analytics] Date ranges:', {
      startDate: startDate.toISOString(),
      previousStart: previousStart.toISOString(),
      yearStart: yearStart.toISOString(),
    })

    // Use retryWithFreshClient to avoid prepared statement errors
    let recentReceipts: any[] = []
    let previousReceipts: any[] = []
    let yearReceipts: any[] = []

    try {
      console.log('[Analytics] Fetching recent receipts...')
      recentReceipts = await retryWithFreshClient(async (prisma: PrismaClient) => {
        const receipts = await prisma.receipt.findMany({
          where: {
            createdAt: { gte: startDate },
          },
          include: {
            store: {
              select: {
                id: true,
                name: true,
              },
            },
            lineItems: {
              select: {
                id: true,
                category: true,
                productName: true,
                quantity: true,
                unitPrice: true,
              },
            },
          },
        })
        console.log('[Analytics] Recent receipts fetched:', receipts.length)
        return receipts
      })
    } catch (error) {
      console.error('[Analytics] Error fetching recent receipts:', error)
      throw error
    }

    try {
      console.log('[Analytics] Fetching previous receipts...')
      previousReceipts = await retryWithFreshClient(async (prisma: PrismaClient) => {
        const receipts = await prisma.receipt.findMany({
          where: {
            createdAt: {
              gte: previousStart,
              lt: startDate,
            },
          },
          select: {
            totalAmount: true,
            customerId: true,
            status: true,
          },
        })
        console.log('[Analytics] Previous receipts fetched:', receipts.length)
        return receipts
      })
    } catch (error) {
      console.error('[Analytics] Error fetching previous receipts:', error)
      // Continue with empty array if this fails
      previousReceipts = []
    }

    try {
      console.log('[Analytics] Fetching year receipts...')
      yearReceipts = await retryWithFreshClient(async (prisma: PrismaClient) => {
        const receipts = await prisma.receipt.findMany({
          where: {
            createdAt: { gte: yearStart },
          },
          select: {
            status: true,
          },
        })
        console.log('[Analytics] Year receipts fetched:', receipts.length)
        return receipts
      })
    } catch (error) {
      console.error('[Analytics] Error fetching year receipts:', error)
      // Continue with empty array if this fails
      yearReceipts = []
    }

    // If no receipts found, return empty data (not fallback)
    if (!recentReceipts || recentReceipts.length === 0) {
      console.log('[Analytics] No recent receipts found, returning empty data')
      return {
        hasData: false,
        overview: {
          totalReceipts: 0,
          totalRevenue: 0,
          averageBasket: 0,
          activeCustomers: 0,
          identificationRate: 0,
          digitalRate: 0,
        },
        trends: [],
        stores: [],
        categories: [],
        identification: {
          identifiedRevenueShare: 0,
          identifiedAverageBasket: 0,
          unidentifiedAverageBasket: 0,
          identifiedFrequency: 0,
        },
        environment: {
          digitalTicketsYear: 0,
          paperSavedKg: 0,
          co2SavedKg: 0,
          treesEquivalent: 0,
        },
      }
    }

    console.log('[Analytics] Processing receipts data...')

    // Safely calculate totals
    const totalRevenue = recentReceipts.reduce(
      (sum, receipt) => {
        const amount = receipt?.totalAmount ? Number(receipt.totalAmount) : 0
        return sum + (isNaN(amount) ? 0 : amount)
      },
      0
    )
    const totalReceipts = recentReceipts.length
    
    // Get unique customers safely
    const customerIds = recentReceipts
      .filter((r) => r?.customerId)
      .map((r) => r.customerId)
      .filter((id): id is string => typeof id === 'string' && id.length > 0)
    
    const activeCustomers = new Set(customerIds).size
    const identifiedReceipts = customerIds.length
    const digitalReceipts = recentReceipts.filter((r) => r?.status === 'RECLAME').length

    console.log('[Analytics] Calculated metrics:', {
      totalReceipts,
      totalRevenue,
      activeCustomers,
      identifiedReceipts,
      digitalReceipts,
    })

    // Calculate previous period metrics safely
    const prevRevenue = (previousReceipts || []).reduce(
      (sum, receipt) => {
        const amount = receipt?.totalAmount ? Number(receipt.totalAmount) : 0
        return sum + (isNaN(amount) ? 0 : amount)
      },
      0
    )
    const prevReceiptsCount = previousReceipts?.length || 0
    const prevIdentified = (previousReceipts || []).filter((r) => r?.customerId).length

    // Build daily trends
    const dailyMap = new Map<string, { tickets: number; revenue: number }>()
    recentReceipts.forEach((receipt) => {
      if (!receipt?.createdAt) return
      
      try {
        const date = new Date(receipt.createdAt)
        if (isNaN(date.getTime())) return
        
        const key = date.toISOString().split('T')[0]
        const current = dailyMap.get(key) || { tickets: 0, revenue: 0 }
        const amount = receipt?.totalAmount ? Number(receipt.totalAmount) : 0
        
        dailyMap.set(key, {
          tickets: current.tickets + 1,
          revenue: current.revenue + (isNaN(amount) ? 0 : amount),
        })
      } catch (error) {
        console.error('[Analytics] Error processing receipt date:', error)
      }
    })

    const trends = Array.from(dailyMap.entries())
      .map(([date, value]) => ({
        date,
        tickets: value.tickets || 0,
        revenue: value.revenue || 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    console.log('[Analytics] Trends calculated:', trends.length, 'days')

    // Build store performance
    const storeMap = new Map<
      string,
      {
        name: string
        revenue: number
        tickets: number
        identified: number
      }
    >()

    recentReceipts.forEach((receipt) => {
      if (!receipt?.storeId) return
      
      const storeId = receipt.storeId
      const storeName = receipt?.store?.name || 'Magasin inconnu'
      const amount = receipt?.totalAmount ? Number(receipt.totalAmount) : 0
      
      if (!storeMap.has(storeId)) {
        storeMap.set(storeId, {
          name: storeName,
          revenue: 0,
          tickets: 0,
          identified: 0,
        })
      }
      
      const entry = storeMap.get(storeId)!
      entry.revenue += isNaN(amount) ? 0 : amount
      entry.tickets += 1
      if (receipt?.customerId) {
        entry.identified += 1
      }
    })

    const stores: StorePerformance[] = Array.from(storeMap.entries()).map(
      ([id, value]) => ({
        id,
        name: value.name || 'Magasin inconnu',
        revenue: value.revenue || 0,
        tickets: value.tickets || 0,
        averageBasket: value.tickets > 0 ? (value.revenue || 0) / value.tickets : 0,
        identificationRate: value.tickets > 0 ? ((value.identified || 0) / value.tickets) * 100 : 0,
      })
    )

    console.log('[Analytics] Stores calculated:', stores.length)

    // Build category performance
    const categoryMap = new Map<
      string,
      {
        revenue: number
        receipts: Set<string>
      }
    >()

    recentReceipts.forEach((receipt) => {
      if (!receipt?.lineItems || !Array.isArray(receipt.lineItems)) return
      
      receipt.lineItems.forEach((item: any) => {
        if (!item) return
        
        const category = item?.category || 'Divers'
        const quantity = item?.quantity ? Number(item.quantity) : 0
        const unitPrice = item?.unitPrice ? Number(item.unitPrice) : 0
        
        if (!categoryMap.has(category)) {
          categoryMap.set(category, {
            revenue: 0,
            receipts: new Set<string>(),
          })
        }
        
        const entry = categoryMap.get(category)!
        const itemRevenue = (isNaN(quantity) ? 0 : quantity) * (isNaN(unitPrice) ? 0 : unitPrice)
        entry.revenue += itemRevenue
        
        if (receipt?.id) {
          entry.receipts.add(receipt.id)
        }
      })
    })

    const categories: CategoryPerformance[] = Array.from(categoryMap.entries()).map(
      ([name, value]) => ({
        name: name || 'Divers',
        revenue: value.revenue || 0,
        tickets: value.receipts.size || 0,
        averageBasket: value.receipts.size > 0 ? (value.revenue || 0) / value.receipts.size : 0,
      })
    )

    console.log('[Analytics] Categories calculated:', categories.length)

    // Calculate identification metrics
    const identifiedRevenue = recentReceipts
      .filter((r) => r?.customerId)
      .reduce((sum, receipt) => {
        const amount = receipt?.totalAmount ? Number(receipt.totalAmount) : 0
        return sum + (isNaN(amount) ? 0 : amount)
      }, 0)
    
    const unidentifiedRevenue = totalRevenue - identifiedRevenue

    const identifiedAverageBasket =
      identifiedReceipts > 0 ? identifiedRevenue / identifiedReceipts : 0
    const unidentifiedAverageBasket =
      totalReceipts - identifiedReceipts > 0
        ? unidentifiedRevenue / (totalReceipts - identifiedReceipts)
        : 0

    const identifiedFrequency =
      identifiedReceipts > 0 && activeCustomers > 0
        ? identifiedReceipts / activeCustomers
        : 0

    // Calculate environment impact
    const digitalYear = (yearReceipts || []).filter((r) => r?.status === 'RECLAME').length
    const paperSaved = digitalYear * 0.003 // 3g per ticket => kg
    const co2Saved = paperSaved * 0.8
    const trees = paperSaved * 0.1

    console.log('[Analytics] All calculations complete, returning data')

    return {
      hasData: true,
      overview: {
        totalReceipts,
        totalRevenue,
        averageBasket: totalReceipts > 0 ? totalRevenue / totalReceipts : 0,
        activeCustomers,
        identificationRate: totalReceipts > 0 ? (identifiedReceipts / totalReceipts) * 100 : 0,
        digitalRate: totalReceipts > 0 ? (digitalReceipts / totalReceipts) * 100 : 0,
        trends: {
          receiptsTrend:
            prevReceiptsCount > 0
              ? ((totalReceipts - prevReceiptsCount) / prevReceiptsCount) * 100
              : 0,
          revenueTrend:
            prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0,
          identificationTrend:
            prevReceiptsCount > 0
              ? (identifiedReceipts / totalReceipts) * 100 -
                (prevIdentified / prevReceiptsCount) * 100
              : 0,
        },
      },
      trends,
      stores: stores.sort((a, b) => b.revenue - a.revenue),
      categories: categories.sort((a, b) => b.revenue - a.revenue).slice(0, 6),
      identification: {
        identifiedRevenueShare: totalRevenue > 0 ? (identifiedRevenue / totalRevenue) * 100 : 0,
        identifiedAverageBasket,
        unidentifiedAverageBasket,
        identifiedFrequency,
      },
      environment: {
        digitalTicketsYear: digitalYear,
        paperSavedKg: paperSaved,
        co2SavedKg: co2Saved,
        treesEquivalent: trees,
      },
    }
  } catch (error) {
    console.error('[Analytics] Failed to build overview:', error)
    // Log detailed error for debugging
    if (error instanceof Error) {
      console.error('[Analytics] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      })
    } else {
      console.error('[Analytics] Unknown error:', error)
    }
    // Return empty data instead of fallback to indicate error
    return {
      hasData: false,
      overview: {
        totalReceipts: 0,
        totalRevenue: 0,
        averageBasket: 0,
        activeCustomers: 0,
        identificationRate: 0,
        digitalRate: 0,
      },
      trends: [],
      stores: [],
      categories: [],
      identification: {
        identifiedRevenueShare: 0,
        identifiedAverageBasket: 0,
        unidentifiedAverageBasket: 0,
        identifiedFrequency: 0,
      },
      environment: {
        digitalTicketsYear: 0,
        paperSavedKg: 0,
        co2SavedKg: 0,
        treesEquivalent: 0,
      },
    }
  }
}
