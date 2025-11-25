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

const FALLBACK_DATA: AnalyticsOverview = {
  hasData: false,
  overview: {
    totalReceipts: 12450,
    totalRevenue: 452300,
    averageBasket: 36.3,
    activeCustomers: 2140,
    identificationRate: 72.5,
    digitalRate: 68.0,
    trends: {
      receiptsTrend: 5.2,
      revenueTrend: 7.8,
      identificationTrend: 2.1,
    },
  },
  trends: Array.from({ length: 30 }).map((_, index) => {
    const base = 320 + Math.sin(index / 4) * 35
    const revenue = base * (30 + (index % 5))
    return {
      date: new Date(Date.now() - (29 - index) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      tickets: Math.round(base),
      revenue: Math.round(revenue),
    }
  }),
  stores: [
    {
      id: '1',
      name: 'Paris Bastille',
      tickets: 2800,
      revenue: 145000,
      averageBasket: 51.7,
      identificationRate: 78.4,
    },
    {
      id: '2',
      name: 'Lyon Part-Dieu',
      tickets: 2100,
      revenue: 112500,
      averageBasket: 53.5,
      identificationRate: 70.1,
    },
    {
      id: '3',
      name: 'Bordeaux Centre',
      tickets: 1300,
      revenue: 68500,
      averageBasket: 52.7,
      identificationRate: 74.2,
    },
  ],
  categories: [
    { name: 'Épicerie', revenue: 125000, tickets: 5200, averageBasket: 24.0 },
    { name: 'Frais', revenue: 89000, tickets: 4100, averageBasket: 21.7 },
    { name: 'Hi-Tech', revenue: 72000, tickets: 620, averageBasket: 116.1 },
  ],
  identification: {
    identifiedRevenueShare: 68,
    identifiedAverageBasket: 44,
    unidentifiedAverageBasket: 28,
    identifiedFrequency: 2.8,
  },
  environment: {
    digitalTicketsYear: 16200,
    paperSavedKg: 48.5,
    co2SavedKg: 38.4,
    treesEquivalent: 4.8,
  },
}

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  try {
    const now = new Date()
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - 30)

    const previousStart = new Date(startDate)
    previousStart.setDate(previousStart.getDate() - 30)

    const yearStart = new Date(now)
    yearStart.setFullYear(yearStart.getFullYear() - 1)

    // Use retryWithFreshClient to avoid prepared statement errors
    const [recentReceipts, previousReceipts, yearReceipts] = await Promise.all([
      retryWithFreshClient(async (prisma: PrismaClient) => {
        return await prisma.receipt.findMany({
          where: {
            createdAt: { gte: startDate },
          },
          include: {
            store: true,
            lineItems: true,
          },
        })
      }),
      retryWithFreshClient(async (prisma: PrismaClient) => {
        return await prisma.receipt.findMany({
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
      }),
      retryWithFreshClient(async (prisma: PrismaClient) => {
        return await prisma.receipt.findMany({
          where: {
            createdAt: { gte: yearStart },
          },
          select: {
            status: true,
          },
        })
      }),
    ])

    // If no receipts found, return empty data (not fallback)
    if (recentReceipts.length === 0) {
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

    const totalRevenue = recentReceipts.reduce(
      (sum, receipt) => sum + Number(receipt.totalAmount),
      0
    )
    const totalReceipts = recentReceipts.length
    const activeCustomers = new Set(
      recentReceipts.filter((r) => r.customerId).map((r) => r.customerId as string)
    ).size
    const identifiedReceipts = recentReceipts.filter((r) => r.customerId).length
    const digitalReceipts = recentReceipts.filter((r) => r.status === 'RECLAME').length

    const prevRevenue = previousReceipts.reduce(
      (sum, receipt) => sum + Number(receipt.totalAmount),
      0
    )
    const prevReceiptsCount = previousReceipts.length
    const prevIdentified = previousReceipts.filter((r) => r.customerId).length

    const dailyMap = new Map<string, { tickets: number; revenue: number }>()
    recentReceipts.forEach((receipt) => {
      const key = receipt.createdAt.toISOString().split('T')[0]
      const current = dailyMap.get(key) || { tickets: 0, revenue: 0 }
      dailyMap.set(key, {
        tickets: current.tickets + 1,
        revenue: current.revenue + Number(receipt.totalAmount),
      })
    })

    const trends = Array.from(dailyMap.entries())
      .map(([date, value]) => ({
        date,
        tickets: value.tickets,
        revenue: value.revenue,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

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
      const storeId = receipt.storeId
      if (!storeMap.has(storeId)) {
        storeMap.set(storeId, {
          name: receipt.store?.name || 'Magasin inconnu',
          revenue: 0,
          tickets: 0,
          identified: 0,
        })
      }
      const entry = storeMap.get(storeId)!
      entry.revenue += Number(receipt.totalAmount)
      entry.tickets += 1
      if (receipt.customerId) {
        entry.identified += 1
      }
    })

    const stores: StorePerformance[] = Array.from(storeMap.entries()).map(
      ([id, value]) => ({
        id,
        name: value.name,
        revenue: value.revenue,
        tickets: value.tickets,
        averageBasket: value.tickets > 0 ? value.revenue / value.tickets : 0,
        identificationRate: value.tickets > 0 ? (value.identified / value.tickets) * 100 : 0,
      })
    )

    const categoryMap = new Map<
      string,
      {
        revenue: number
        receipts: Set<string>
      }
    >()

    recentReceipts.forEach((receipt) => {
      receipt.lineItems.forEach((item) => {
        const category = item.category || 'Divers'
        if (!categoryMap.has(category)) {
          categoryMap.set(category, {
            revenue: 0,
            receipts: new Set<string>(),
          })
        }
        const entry = categoryMap.get(category)!
        entry.revenue += Number(item.unitPrice) * item.quantity
        entry.receipts.add(receipt.id)
      })
    })

    const categories: CategoryPerformance[] = Array.from(categoryMap.entries()).map(
      ([name, value]) => ({
        name,
        revenue: value.revenue,
        tickets: value.receipts.size,
        averageBasket: value.receipts.size > 0 ? value.revenue / value.receipts.size : 0,
      })
    )

    const identifiedRevenue = recentReceipts
      .filter((r) => r.customerId)
      .reduce((sum, receipt) => sum + Number(receipt.totalAmount), 0)
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

    const digitalYear = yearReceipts.filter((r) => r.status === 'RECLAME').length
    const paperSaved = digitalYear * 0.003 // 3g per ticket => kg
    const co2Saved = paperSaved * 0.8
    const trees = paperSaved * 0.1

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

